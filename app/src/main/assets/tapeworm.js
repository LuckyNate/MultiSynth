"use strict";

/* TAPEWORM — literal circular tape loop.
   PLAY -> ATTENUATE OLD TAPE -> ADD FRESH MIC -> RECORD -> advance.
   FALLOFF affects only the old tape contribution before overdub.
*/

const BASE_LOOP_SECONDS=4;
const STATE_KEY="tapeworm-basic-v11";
const PROCESS_FRAMES=1024;
const CEILING=.92;
try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null,running=false,drawHandle=0,processor=null,silentKeepAlive=null;
let micStream=null,micSource=null,nativeUnsubscribe=null,nativeMode=false;
let tape=null,tapeLength=0,head=0,lastProcessedCell=-1;
let nativeQueue=[],nativeQueueOffset=0;
let recordScope=new Float32Array(PROCESS_FRAMES),recordScopeWrite=0;

let inHpX1=0,inHpY1=0,inLp1=0,inLp2=0;
let outHpX1=0,outHpY1=0,outLp1=0,outLp2=0;
let protectEnv=0,protectGain=1;

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
function retention(){const f=falloffAmount();return 1-f}
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

function conditionRecordInput(x){
  const sr=ctx?ctx.sampleRate:48000;
  const hpA=hpCoeff(75,sr);
  const hp=x-inHpX1+hpA*inHpY1;inHpX1=x;inHpY1=hp;
  const lpA=lpCoeff(7200,sr);
  inLp1=(1-lpA)*hp+lpA*inLp1;
  inLp2=(1-lpA)*inLp1+lpA*inLp2;

  const mag=Math.abs(inLp2);
  const envA=mag>protectEnv?.992:.9995;
  protectEnv=envA*protectEnv+(1-envA)*mag;
  const threshold=.40;
  let target=1;
  if(protectEnv>threshold)target=Math.max(.18,threshold/protectEnv);
  const gA=target<protectGain?.98:.9997;
  protectGain=gA*protectGain+(1-gA)*target;
  return clamp(inLp2*protectGain);
}

function conditionPlayback(x){
  const sr=ctx?ctx.sampleRate:48000;
  const hpA=hpCoeff(90,sr);
  const hp=x-outHpX1+hpA*outHpY1;outHpX1=x;outHpY1=hp;
  const lpA=lpCoeff(6300,sr);
  outLp1=(1-lpA)*hp+lpA*outLp1;
  outLp2=(1-lpA)*outLp1+lpA*outLp2;
  return clamp(outLp2);
}

function rewriteCell(idx,fresh,keep){
  // OLD TAPE is attenuated first. This value can never bypass FALLOFF.
  const old=tape[idx];
  const retained=clamp(old*keep);

  // Only after attenuation is the fresh microphone overdub added.
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
    const idx=wrapCell(c);
    if(idx===lastProcessedCell)continue;
    rewriteCell(idx,fresh,keep);
    lastProcessedCell=idx;
  }
}

function buildTapeEngine(){
  tapeLength=Math.max(1,Math.round(ctx.sampleRate*BASE_LOOP_SECONDS));
  tape=new Float32Array(tapeLength);head=0;lastProcessedCell=-1;recordScope.fill(0);recordScopeWrite=0;clearNativeQueue();
  inHpX1=inHpY1=inLp1=inLp2=0;outHpX1=outHpY1=outLp1=outLp2=0;protectEnv=0;protectGain=1;
  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null;
    const output=e.outputBuffer.getChannelData(0);
    const step=speed();
    const keep=retention();

    for(let i=0;i<output.length;i++){
      // PLAY HEAD hears the old tape once before attenuation/rewrite.
      output[i]=conditionPlayback(clamp(tape[cellIndex(head)]));

      const raw=nativeMode?pullNativeSample():(input?input[i]:0);
      const fresh=conditionRecordInput(clamp(raw));
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
    micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
    micSource=ctx.createMediaStreamSource(micStream);micSource.connect(processor);statusEl.textContent="TAPE RUNNING // DIRECT MIC + AEC";return;
  }catch(e){console.warn("direct mic failed, using native fallback",e)}}
  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;nativeUnsubscribe=MultiSynthNativeMic.subscribe(pcm=>pushNative(pcm));
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
    const zero=ctx.createConstantSource();zero.offset.value=0;zero.connect(processor);zero.start();silentKeepAlive=zero;statusEl.textContent="TAPE RUNNING // NATIVE MIC + PROTECT";return;
  }
  throw new Error("Microphone unavailable");
}
async function startTape(){if(running){await stopTape();return}try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");ctx=new A({latencyHint:"interactive"});await ctx.resume();running=true;buildTapeEngine();await startInput();runButton.textContent="STOP TAPE";runButton.classList.add("active");drawScope()}catch(e){console.error(e);statusEl.textContent="INPUT ERROR";await stopTape(true)}}
async function stopTape(preserveError=false){running=false;cancelAnimationFrame(drawHandle);if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}if(window.MultiSynthNativeMic){try{MultiSynthNativeMic.stop()}catch(_){}}clearNativeQueue();nativeMode=false;if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;try{micSource&&micSource.disconnect()}catch(_){}micSource=null;try{processor&&(processor.onaudioprocess=null,processor.disconnect())}catch(_){}processor=null;try{silentKeepAlive&&silentKeepAlive.stop&&silentKeepAlive.stop()}catch(_){}try{silentKeepAlive&&silentKeepAlive.disconnect&&silentKeepAlive.disconnect()}catch(_){}silentKeepAlive=null;if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}ctx=null;tape=null;tapeLength=0;head=0;lastProcessedCell=-1;recordScope.fill(0);recordScopeWrite=0;runButton.textContent="START TAPE";runButton.classList.remove("active");if(!preserveError)statusEl.textContent="STOPPED";clearScope()}
function resizeScope(){const dpr=window.devicePixelRatio||1,r=scope.getBoundingClientRect();scope.width=Math.max(1,Math.floor(r.width*dpr));scope.height=Math.max(1,Math.floor(r.height*dpr));scopeCtx.setTransform(dpr,0,0,dpr,0,0);if(!running)clearScope()}
function clearScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#f58ab3";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke()}
function drawScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);if(running){scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();const n=recordScope.length;for(let i=0;i<n;i++){const idx=(recordScopeWrite+i)%n,s=recordScope[idx],x=i/(n-1)*w,y=h*.5-s*(h*.45/CEILING);i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y)}scopeCtx.stroke()}scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();if(running)drawHandle=requestAnimationFrame(drawScope)}
tapeSpeed.addEventListener("input",()=>{updateReadouts();saveState()});falloff.addEventListener("input",()=>{updateReadouts();saveState()});runButton.addEventListener("click",startTape);window.addEventListener("resize",resizeScope);window.addEventListener("pagehide",()=>{if(running)stopTape()});
loadState();updateReadouts();requestAnimationFrame(resizeScope);
