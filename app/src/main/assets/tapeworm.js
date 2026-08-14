"use strict";

/* TAPEWORM — first-principles continuous tape loop.
   PLAY old tape -> ATTENUATE old tape -> gate fresh mic -> RECORD -> advance.
   No dry monitor, echo canceller, EQ effects, saturation, wow, flutter or wear.
*/

const BASE_LOOP_SECONDS=4;
const STATE_KEY="tapeworm-basic-v13";
const PROCESS_FRAMES=1024;
const CEILING=.92;

// The microphone must exceed this level before it is allowed onto tape.
// Hysteresis + hold keep speech/music natural instead of chattering at the threshold.
const GATE_OPEN=.055;
const GATE_CLOSE=.035;
const GATE_HOLD_SECONDS=.12;
const GATE_ATTACK_SECONDS=.004;
const GATE_RELEASE_SECONDS=.045;

try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null,running=false,drawHandle=0,processor=null,silentKeepAlive=null;
let micStream=null,micSource=null,nativeUnsubscribe=null,nativeMode=false;
let tape=null,tapeLength=0,head=0,lastProcessedCell=-1;
let nativeQueue=[],nativeQueueOffset=0;
let recordScope=new Float32Array(PROCESS_FRAMES),recordScopeWrite=0;
let gateEnv=0,gateGain=0,gateHold=0;

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

function gateMic(x){
  const sr=ctx?ctx.sampleRate:48000;
  const mag=Math.abs(x);
  const envCoeff=mag>gateEnv?Math.exp(-1/(sr*.002)):Math.exp(-1/(sr*.035));
  gateEnv=envCoeff*gateEnv+(1-envCoeff)*mag;

  if(gateEnv>=GATE_OPEN){gateHold=Math.round(GATE_HOLD_SECONDS*sr)}
  else if(gateHold>0)gateHold--;

  const shouldOpen=gateEnv>=GATE_OPEN || (gateGain>0 && (gateEnv>=GATE_CLOSE || gateHold>0));
  const target=shouldOpen?1:0;
  const time=target>gateGain?GATE_ATTACK_SECONDS:GATE_RELEASE_SECONDS;
  const coeff=Math.exp(-1/(sr*time));
  gateGain=coeff*gateGain+(1-coeff)*target;
  if(gateGain<1e-4)gateGain=0;
  return clamp(x*gateGain);
}

function rewriteCell(idx,fresh,keep){
  // Dedicated attenuation head: old tape is reduced BEFORE any new mic is considered.
  const retained=clamp(tape[idx]*keep);
  // Record head: only gated microphone is added after attenuation.
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
  gateEnv=0;gateGain=0;gateHold=0;
  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null;
    const output=e.outputBuffer.getChannelData(0);
    const step=speed(),keep=retention();

    for(let i=0;i<output.length;i++){
      // PLAY HEAD: output only the existing tape. Nothing from output is routed to RECORD in software.
      output[i]=clamp(tape[cellIndex(head)]);

      // RECORD INPUT: microphone only, and only when it clears the gate threshold.
      const raw=clamp(nativeMode?pullNativeSample():(input?input[i]:0));
      const fresh=gateMic(raw);

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
    micSource=ctx.createMediaStreamSource(micStream);micSource.connect(processor);statusEl.textContent="TAPE RUNNING // MIC GATE";return;
  }catch(e){console.warn("direct mic failed, using native fallback",e)}}
  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;nativeUnsubscribe=MultiSynthNativeMic.subscribe(pcm=>pushNative(pcm));
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
    const zero=ctx.createConstantSource();zero.offset.value=0;zero.connect(processor);zero.start();silentKeepAlive=zero;statusEl.textContent="TAPE RUNNING // NATIVE MIC GATE";return;
  }
  throw new Error("Microphone unavailable");
}
async function startTape(){if(running){await stopTape();return}try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");ctx=new A({latencyHint:"interactive"});await ctx.resume();running=true;buildTapeEngine();await startInput();runButton.textContent="STOP TAPE";runButton.classList.add("active");drawScope()}catch(e){console.error(e);statusEl.textContent="INPUT ERROR";await stopTape(true)}}
async function stopTape(preserveError=false){running=false;cancelAnimationFrame(drawHandle);if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}if(window.MultiSynthNativeMic){try{MultiSynthNativeMic.stop()}catch(_){}}clearNativeQueue();nativeMode=false;if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;try{micSource&&micSource.disconnect()}catch(_){}micSource=null;try{processor&&(processor.onaudioprocess=null,processor.disconnect())}catch(_){}processor=null;try{silentKeepAlive&&silentKeepAlive.stop&&silentKeepAlive.stop()}catch(_){}try{silentKeepAlive&&silentKeepAlive.disconnect&&silentKeepAlive.disconnect()}catch(_){}silentKeepAlive=null;if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}ctx=null;tape=null;tapeLength=0;head=0;lastProcessedCell=-1;recordScope.fill(0);recordScopeWrite=0;gateEnv=0;gateGain=0;gateHold=0;runButton.textContent="START TAPE";runButton.classList.remove("active");if(!preserveError)statusEl.textContent="STOPPED";clearScope()}
function resizeScope(){const dpr=window.devicePixelRatio||1,r=scope.getBoundingClientRect();scope.width=Math.max(1,Math.floor(r.width*dpr));scope.height=Math.max(1,Math.floor(r.height*dpr));scopeCtx.setTransform(dpr,0,0,dpr,0,0);if(!running)clearScope()}
function clearScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#f58ab3";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke()}
function drawScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);if(running){scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();const n=recordScope.length;for(let i=0;i<n;i++){const idx=(recordScopeWrite+i)%n,s=recordScope[idx],x=i/(n-1)*w,y=h*.5-s*(h*.45/CEILING);i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y)}scopeCtx.stroke()}scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();if(running)drawHandle=requestAnimationFrame(drawScope)}
tapeSpeed.addEventListener("input",()=>{updateReadouts();saveState()});falloff.addEventListener("input",()=>{updateReadouts();saveState()});runButton.addEventListener("click",startTape);window.addEventListener("resize",resizeScope);window.addEventListener("pagehide",()=>{if(running)stopTape()});
loadState();updateReadouts();requestAnimationFrame(resizeScope);
