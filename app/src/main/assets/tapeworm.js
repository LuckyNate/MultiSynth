"use strict";

/* TAPEWORM — literal circular tape loop.
   PLAY -> ATTENUATE OLD TAPE -> ADD CLEAN MIC -> RECORD -> advance.
   The mic path uses the actual speaker output as an adaptive echo reference.
*/

const BASE_LOOP_SECONDS=4;
const STATE_KEY="tapeworm-basic-v12";
const PROCESS_FRAMES=1024;
const CEILING=.92;

// Adaptive echo canceller. The long reference history lets us find the phone's
// speaker -> air -> microphone delay; the FIR then learns the local acoustic path.
const AEC_HISTORY=16384;
const AEC_TAPS=64;
const AEC_MIN_DELAY=128;
const AEC_MAX_DELAY=6144;
const AEC_DELAY_STEP=64;
const AEC_SEARCH_EVERY=8;
const AEC_MU=.06;
const AEC_EPS=1e-5;

try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null,running=false,drawHandle=0,processor=null,silentKeepAlive=null;
let micStream=null,micSource=null,nativeUnsubscribe=null,nativeMode=false;
let tape=null,tapeLength=0,head=0,lastProcessedCell=-1;
let nativeQueue=[],nativeQueueOffset=0;
let recordScope=new Float32Array(PROCESS_FRAMES),recordScopeWrite=0;

// Gentler safety filtering now that adaptive echo cancellation does the main job.
let inHpX1=0,inHpY1=0,inLp1=0;
let outHpX1=0,outHpY1=0,outLp1=0;
let protectEnv=0,protectGain=1;

// Speaker-reference AEC state.
let aecRef=new Float32Array(AEC_HISTORY),aecRefWrite=0;
let aecWeights=new Float32Array(AEC_TAPS);
let aecDelay=960; // ~20 ms at 48 kHz; delay search continuously corrects it.
let aecSearchCounter=0;
let aecMicBlock=new Float32Array(PROCESS_FRAMES);
let aecRefEnergy=.0001,aecErrEnergy=.0001;

const tapeSpeed=document.getElementById("tapeSpeed");
const falloff=document.getElementById("falloff");
const speedValue=document.getElementById("speedValue");
const falloffValue=document.getElementById("falloffValue");
const speedReadout=document.getElementById("speedReadout");
const falloffReadout=document.getElementById("falloffReadout");
const runButton=document.getElementById("runButton");
const statusEl=document.getElementById("status");
const scope=document.getElementById("scope");
const scopeCtx=scope.getContext("2d");

function speed(){return Math.max(.125,Math.min(8,Number(tapeSpeed.value)||1))}
function falloffAmount(){return Math.max(0,Math.min(1,Number(falloff.value)||0))}
function retention(){return 1-falloffAmount()}
function loopSeconds(){return BASE_LOOP_SECONDS/speed()}
function clamp(x){return !Number.isFinite(x)?0:Math.max(-CEILING,Math.min(CEILING,x))}
function wrapCell(i){i%=tapeLength;if(i<0)i+=tapeLength;return i}
function cellIndex(pos){return wrapCell(Math.floor(pos))}
function updateReadouts(){const s=speed(),f=falloffAmount(),sec=loopSeconds();speedValue.textContent=`${s.toFixed(3)}×`;falloffValue.textContent=`${Math.round(f*100)}%`;speedReadout.textContent=`${s.toFixed(3)}× // ${sec>=10?sec.toFixed(1):sec.toFixed(2)} s LOOP`;falloffReadout.textContent=`FALLOFF ${Math.round(f*100)}%`}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify({tapeSpeed:tapeSpeed.value,falloff:falloff.value}))}catch(_){}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||"null");if(s){if(s.tapeSpeed!==undefined)tapeSpeed.value=s.tapeSpeed;if(s.falloff!==undefined)falloff.value=s.falloff}}catch(_){}}
function clearNativeQueue(){nativeQueue=[];nativeQueueOffset=0}
function pushNative(pcm){if(pcm&&pcm.length)nativeQueue.push(pcm)}
function pullNativeSample(){while(nativeQueue.length){const a=nativeQueue[0];if(nativeQueueOffset<a.length)return a[nativeQueueOffset++];nativeQueue.shift();nativeQueueOffset=0}return 0}
function hpCoeff(fc,sr){return Math.exp(-2*Math.PI*fc/sr)}
function lpCoeff(fc,sr){return Math.exp(-2*Math.PI*fc/sr)}

function resetAec(){
  aecRef.fill(0);aecWeights.fill(0);aecRefWrite=0;aecDelay=960;aecSearchCounter=0;
  aecMicBlock.fill(0);aecRefEnergy=.0001;aecErrEnergy=.0001;
}
function refAtDelay(delay,tap=0){
  let idx=aecRefWrite-1-delay-tap;
  idx%=AEC_HISTORY;if(idx<0)idx+=AEC_HISTORY;
  return aecRef[idx];
}
function pushSpeakerReference(x){
  aecRef[aecRefWrite]=x;
  aecRefWrite=(aecRefWrite+1)%AEC_HISTORY;
}

function searchEchoDelay(micBlock){
  // Coarse normalized correlation. We only search periodically, keeping CPU sane.
  let micEnergy=1e-9;
  for(let i=0;i<micBlock.length;i+=4){const m=micBlock[i];micEnergy+=m*m}
  if(micEnergy<1e-5)return;

  let bestDelay=aecDelay,bestScore=0;
  for(let d=AEC_MIN_DELAY;d<=AEC_MAX_DELAY;d+=AEC_DELAY_STEP){
    let corr=0,refE=1e-9;
    for(let i=0;i<micBlock.length;i+=4){
      let idx=aecRefWrite-1-d-(micBlock.length-1-i);
      idx%=AEC_HISTORY;if(idx<0)idx+=AEC_HISTORY;
      const r=aecRef[idx],m=micBlock[i];
      corr+=m*r;refE+=r*r;
    }
    const score=Math.abs(corr)/Math.sqrt(micEnergy*refE);
    if(score>bestScore){bestScore=score;bestDelay=d}
  }

  // Only move the delay when the relationship is strong enough to plausibly be echo.
  if(bestScore>.18 && Math.abs(bestDelay-aecDelay)>=AEC_DELAY_STEP){
    aecDelay=bestDelay;
    aecWeights.fill(0); // relearn path around the newly aligned delay.
  }
}

function cancelSpeakerEcho(mic){
  let estimate=0,norm=AEC_EPS;
  for(let k=0;k<AEC_TAPS;k++){
    const r=refAtDelay(aecDelay,k);
    estimate+=aecWeights[k]*r;
    norm+=r*r;
  }
  let err=mic-estimate;

  const ref0=refAtDelay(aecDelay,0);
  aecRefEnergy=.995*aecRefEnergy+.005*(ref0*ref0);
  aecErrEnergy=.995*aecErrEnergy+.005*(err*err);

  // Double-talk protection: learn only when speaker reference is present and the
  // residual is not overwhelmingly dominated by a new nearby sound/voice.
  const canAdapt=aecRefEnergy>2e-5 && aecErrEnergy<(aecRefEnergy*6+.0025);
  if(canAdapt){
    const step=AEC_MU*err/norm;
    for(let k=0;k<AEC_TAPS;k++)aecWeights[k]+=step*refAtDelay(aecDelay,k);
  }

  return clamp(err);
}

function conditionRecordInput(x){
  const sr=ctx?ctx.sampleRate:48000;
  const hpA=hpCoeff(55,sr);
  const hp=x-inHpX1+hpA*inHpY1;inHpX1=x;inHpY1=hp;
  const lpA=lpCoeff(11500,sr);
  inLp1=(1-lpA)*hp+lpA*inLp1;

  // Mild last-resort protection only; the AEC is now the primary defense.
  const mag=Math.abs(inLp1);
  const envA=mag>protectEnv?.994:.9997;
  protectEnv=envA*protectEnv+(1-envA)*mag;
  const threshold=.68;
  let target=1;
  if(protectEnv>threshold)target=Math.max(.5,threshold/protectEnv);
  const gA=target<protectGain?.992:.9998;
  protectGain=gA*protectGain+(1-gA)*target;
  return clamp(inLp1*protectGain);
}

function conditionPlayback(x){
  const sr=ctx?ctx.sampleRate:48000;
  const hpA=hpCoeff(60,sr);
  const hp=x-outHpX1+hpA*outHpY1;outHpX1=x;outHpY1=hp;
  const lpA=lpCoeff(10500,sr);
  outLp1=(1-lpA)*hp+lpA*outLp1;
  return clamp(outLp1);
}

function rewriteCell(idx,fresh,keep){
  const retained=clamp(tape[idx]*keep);
  const written=clamp(retained+fresh);
  tape[idx]=written;
  recordScope[recordScopeWrite++%recordScope.length]=written;
}
function processTravel(startPos,endPos,fresh,keep){
  let start=Math.floor(startPos),end=Math.floor(endPos);
  if(endPos>=tapeLength)end=Math.floor(endPos-tapeLength)+tapeLength;
  if(end<start)end+=tapeLength;
  if(lastProcessedCell<0){const idx=wrapCell(start);rewriteCell(idx,fresh,keep);lastProcessedCell=idx}
  for(let c=start+1;c<=end;c++){
    const idx=wrapCell(c);if(idx===lastProcessedCell)continue;
    rewriteCell(idx,fresh,keep);lastProcessedCell=idx;
  }
}

function buildTapeEngine(){
  tapeLength=Math.max(1,Math.round(ctx.sampleRate*BASE_LOOP_SECONDS));
  tape=new Float32Array(tapeLength);head=0;lastProcessedCell=-1;recordScope.fill(0);recordScopeWrite=0;clearNativeQueue();
  inHpX1=inHpY1=inLp1=0;outHpX1=outHpY1=outLp1=0;protectEnv=0;protectGain=1;resetAec();
  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null;
    const output=e.outputBuffer.getChannelData(0);
    const step=speed(),keep=retention();

    // Keep a raw mic block for periodic delay estimation before per-sample cancellation.
    for(let i=0;i<output.length;i++)aecMicBlock[i]=clamp(nativeMode?pullNativeSample():(input?input[i]:0));
    if(++aecSearchCounter>=AEC_SEARCH_EVERY){aecSearchCounter=0;searchEchoDelay(aecMicBlock)}

    for(let i=0;i<output.length;i++){
      // What leaves here is exactly what the AEC remembers as speaker reference.
      const speaker=conditionPlayback(clamp(tape[cellIndex(head)]));
      output[i]=speaker;
      pushSpeakerReference(speaker);

      const echoCancelled=cancelSpeakerEcho(aecMicBlock[i]);
      const fresh=conditionRecordInput(echoCancelled);

      let next=head+step;
      processTravel(head,next,fresh,keep);
      while(next>=tapeLength)next-=tapeLength;
      head=next;
    }
  };
  processor.connect(ctx.destination);
}

async function startInput(){
  nativeMode=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:false,autoGainControl:false}});
    micSource=ctx.createMediaStreamSource(micStream);micSource.connect(processor);statusEl.textContent="TAPE RUNNING // ADAPTIVE AEC";return;
  }catch(e){console.warn("direct mic failed, using native fallback",e)}}
  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;nativeUnsubscribe=MultiSynthNativeMic.subscribe(pcm=>pushNative(pcm));
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
    const zero=ctx.createConstantSource();zero.offset.value=0;zero.connect(processor);zero.start();silentKeepAlive=zero;statusEl.textContent="TAPE RUNNING // NATIVE MIC + ADAPTIVE AEC";return;
  }
  throw new Error("Microphone unavailable");
}
async function startTape(){if(running){await stopTape();return}try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");ctx=new A({latencyHint:"interactive"});await ctx.resume();running=true;buildTapeEngine();await startInput();runButton.textContent="STOP TAPE";runButton.classList.add("active");drawScope()}catch(e){console.error(e);statusEl.textContent="INPUT ERROR";await stopTape(true)}}
async function stopTape(preserveError=false){running=false;cancelAnimationFrame(drawHandle);if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}if(window.MultiSynthNativeMic){try{MultiSynthNativeMic.stop()}catch(_){}}clearNativeQueue();nativeMode=false;if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;try{micSource&&micSource.disconnect()}catch(_){}micSource=null;try{processor&&(processor.onaudioprocess=null,processor.disconnect())}catch(_){}processor=null;try{silentKeepAlive&&silentKeepAlive.stop&&silentKeepAlive.stop()}catch(_){}try{silentKeepAlive&&silentKeepAlive.disconnect&&silentKeepAlive.disconnect()}catch(_){}silentKeepAlive=null;if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}ctx=null;tape=null;tapeLength=0;head=0;lastProcessedCell=-1;recordScope.fill(0);recordScopeWrite=0;resetAec();runButton.textContent="START TAPE";runButton.classList.remove("active");if(!preserveError)statusEl.textContent="STOPPED";clearScope()}
function resizeScope(){const dpr=window.devicePixelRatio||1,r=scope.getBoundingClientRect();scope.width=Math.max(1,Math.floor(r.width*dpr));scope.height=Math.max(1,Math.floor(r.height*dpr));scopeCtx.setTransform(dpr,0,0,dpr,0,0);if(!running)clearScope()}
function clearScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#f58ab3";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke()}
function drawScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);if(running){scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();const n=recordScope.length;for(let i=0;i<n;i++){const idx=(recordScopeWrite+i)%n,s=recordScope[idx],x=i/(n-1)*w,y=h*.5-s*(h*.45/CEILING);i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y)}scopeCtx.stroke()}scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();if(running)drawHandle=requestAnimationFrame(drawScope)}
tapeSpeed.addEventListener("input",()=>{updateReadouts();saveState()});falloff.addEventListener("input",()=>{updateReadouts();saveState()});runButton.addEventListener("click",startTape);window.addEventListener("resize",resizeScope);window.addEventListener("pagehide",()=>{if(running)stopTape()});
loadState();updateReadouts();requestAnimationFrame(resizeScope);
