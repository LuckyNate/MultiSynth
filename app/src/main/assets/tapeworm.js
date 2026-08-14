"use strict";

/* TAPEWORM — segmented live PCM loop.
   The worm is a 4-second circular chain of grains.
   Per segment: PLAY current grain -> FALLOFF old grain -> add fresh gated mic at full captured level -> STORE.
   Playback is never routed to record in software.
*/

const BASE_LOOP_SECONDS=4;
const STATE_KEY="tapeworm-granular-v1";
const PROCESS_FRAMES=1024;
const CEILING=.92;
const GATE_HOLD_SECONDS=.10;
const GATE_ATTACK_SECONDS=.003;
const GATE_RELEASE_SECONDS=.035;

try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null,running=false,drawHandle=0,processor=null,silentKeepAlive=null;
let micStream=null,micSource=null,nativeUnsubscribe=null,nativeMode=false;
let nativeQueue=[],nativeQueueOffset=0;
let grains=[],grainSamples=0,grainCount=0,grainIndex=0,grainPhase=0;
let capture=null,capturePos=0;
let gateEnv=0,gateGain=0,gateHold=0;
let recordScope=new Float32Array(PROCESS_FRAMES),recordScopeWrite=0;

const tapeSpeed=document.getElementById("tapeSpeed");
const segmentLength=document.getElementById("segmentLength");
const falloff=document.getElementById("falloff");
const micThreshold=document.getElementById("micThreshold");
const speedValue=document.getElementById("speedValue");
const segmentValue=document.getElementById("segmentValue");
const falloffValue=document.getElementById("falloffValue");
const thresholdValue=document.getElementById("thresholdValue");
const speedReadout=document.getElementById("speedReadout");
const segmentReadout=document.getElementById("segmentReadout");
const runButton=document.getElementById("runButton");
const statusEl=document.getElementById("status");
const scope=document.getElementById("scope");
const scopeCtx=scope.getContext("2d");

function speed(){return Math.max(.125,Math.min(8,Number(tapeSpeed.value)||1))}
function segmentMs(){return Math.max(10,Math.min(500,Number(segmentLength.value)||80))}
function falloffAmount(){return Math.max(0,Math.min(1,Number(falloff.value)||0))}
function retention(){return 1-falloffAmount()}
function threshold(){return Math.max(.02,Math.min(.40,Number(micThreshold.value)||.14))}
function loopSeconds(){return BASE_LOOP_SECONDS/speed()}
function clamp(x){return !Number.isFinite(x)?0:Math.max(-CEILING,Math.min(CEILING,x))}
function updateReadouts(){const s=speed(),ms=segmentMs(),f=falloffAmount(),t=threshold(),sec=loopSeconds();speedValue.textContent=`${s.toFixed(3)}×`;segmentValue.textContent=`${Math.round(ms)} ms`;falloffValue.textContent=`${Math.round(f*100)}%`;thresholdValue.textContent=`${Math.round(t*100)}%`;speedReadout.textContent=`${s.toFixed(3)}× // ${sec>=10?sec.toFixed(1):sec.toFixed(2)} s LOOP`;segmentReadout.textContent=`SEGMENT ${Math.round(ms)} ms`}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify({speed:tapeSpeed.value,segment:segmentLength.value,falloff:falloff.value,threshold:micThreshold.value}))}catch(_){}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||"null");if(!s)return;if(s.speed!==undefined)tapeSpeed.value=s.speed;if(s.segment!==undefined)segmentLength.value=s.segment;if(s.falloff!==undefined)falloff.value=s.falloff;if(s.threshold!==undefined)micThreshold.value=s.threshold}catch(_){}}
function clearNativeQueue(){nativeQueue=[];nativeQueueOffset=0}
function pushNative(pcm){if(pcm&&pcm.length)nativeQueue.push(pcm)}
function pullNativeSample(){while(nativeQueue.length){const a=nativeQueue[0];if(nativeQueueOffset<a.length)return a[nativeQueueOffset++];nativeQueue.shift();nativeQueueOffset=0}return 0}

function gateMic(x){
  const sr=ctx?ctx.sampleRate:48000,open=threshold(),close=open*.62,mag=Math.abs(x);
  const envCoeff=mag>gateEnv?Math.exp(-1/(sr*.002)):Math.exp(-1/(sr*.025));
  gateEnv=envCoeff*gateEnv+(1-envCoeff)*mag;
  if(gateEnv>=open)gateHold=Math.round(GATE_HOLD_SECONDS*sr);else if(gateHold>0)gateHold--;
  const shouldOpen=gateEnv>=open||(gateGain>0&&(gateEnv>=close||gateHold>0));
  const target=shouldOpen?1:0,time=target>gateGain?GATE_ATTACK_SECONDS:GATE_RELEASE_SECONDS,coeff=Math.exp(-1/(sr*time));
  gateGain=coeff*gateGain+(1-coeff)*target;if(gateGain<1e-4)gateGain=0;
  return clamp(x*gateGain);
}

function makeGrains(){
  if(!ctx)return;
  grainSamples=Math.max(8,Math.round(ctx.sampleRate*segmentMs()/1000));
  grainCount=Math.max(1,Math.ceil(ctx.sampleRate*BASE_LOOP_SECONDS/grainSamples));
  grains=Array.from({length:grainCount},()=>new Float32Array(grainSamples));
  capture=new Float32Array(grainSamples);capturePos=0;grainIndex=0;grainPhase=0;
  recordScope.fill(0);recordScopeWrite=0;
}

function finishSegment(){
  const old=grains[grainIndex],keep=retention();
  // PLAY has already occurred while this grain traversed the playback head.
  // FALLOFF now determines only what old material survives into its next revolution.
  for(let i=0;i<grainSamples;i++){
    const written=clamp(old[i]*keep+capture[i]);
    old[i]=written;
    recordScope[recordScopeWrite++%recordScope.length]=written;
  }
  capture.fill(0);capturePos=0;
  grainIndex=(grainIndex+1)%grainCount;
}

function readGrainSample(){
  const g=grains[grainIndex],p=Math.max(0,Math.min(grainSamples-1,grainPhase));
  const i0=Math.floor(p),i1=Math.min(grainSamples-1,i0+1),frac=p-i0;
  return clamp(g[i0]+(g[i1]-g[i0])*frac);
}

function buildEngine(){
  makeGrains();clearNativeQueue();gateEnv=0;gateGain=0;gateHold=0;
  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null,out=e.outputBuffer.getChannelData(0),step=speed();
    for(let i=0;i<out.length;i++){
      // PLAY current completed grain. It gets a full playback before falloff touches its stored copy.
      out[i]=readGrainSample();

      // RECORD only gated microphone into a fresh grain accumulator at captured level.
      const raw=clamp(nativeMode?pullNativeSample():(input?input[i]:0));
      const fresh=gateMic(raw);
      if(capturePos<grainSamples)capture[capturePos++]=fresh;

      grainPhase+=step;
      while(grainPhase>=grainSamples){grainPhase-=grainSamples;finishSegment()}
    }
  };
  processor.connect(ctx.destination);
}

function rebuildSegments(){if(!running||!ctx)return;makeGrains()}

async function startInput(){
  nativeMode=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:false,autoGainControl:false}});
    micSource=ctx.createMediaStreamSource(micStream);micSource.connect(processor);statusEl.textContent="WORM RUNNING // MIC GATE";return;
  }catch(e){console.warn("direct mic failed, using native fallback",e)}}
  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;nativeUnsubscribe=MultiSynthNativeMic.subscribe(pcm=>pushNative(pcm));
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
    const zero=ctx.createConstantSource();zero.offset.value=0;zero.connect(processor);zero.start();silentKeepAlive=zero;statusEl.textContent="WORM RUNNING // NATIVE MIC GATE";return;
  }
  throw new Error("Microphone unavailable");
}
async function startWorm(){if(running){await stopWorm();return}try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");ctx=new A({latencyHint:"interactive"});await ctx.resume();running=true;buildEngine();await startInput();runButton.textContent="STOP WORM";runButton.classList.add("active");drawScope()}catch(e){console.error(e);statusEl.textContent="INPUT ERROR";await stopWorm(true)}}
async function stopWorm(preserveError=false){running=false;cancelAnimationFrame(drawHandle);if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}if(window.MultiSynthNativeMic){try{MultiSynthNativeMic.stop()}catch(_){}}clearNativeQueue();nativeMode=false;if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;try{micSource&&micSource.disconnect()}catch(_){}micSource=null;try{processor&&(processor.onaudioprocess=null,processor.disconnect())}catch(_){}processor=null;try{silentKeepAlive&&silentKeepAlive.stop&&silentKeepAlive.stop()}catch(_){}try{silentKeepAlive&&silentKeepAlive.disconnect&&silentKeepAlive.disconnect()}catch(_){}silentKeepAlive=null;if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}ctx=null;grains=[];capture=null;grainSamples=grainCount=grainIndex=0;grainPhase=0;recordScope.fill(0);recordScopeWrite=0;runButton.textContent="START WORM";runButton.classList.remove("active");if(!preserveError)statusEl.textContent="STOPPED";clearScope()}
function resizeScope(){const dpr=window.devicePixelRatio||1,r=scope.getBoundingClientRect();scope.width=Math.max(1,Math.floor(r.width*dpr));scope.height=Math.max(1,Math.floor(r.height*dpr));scopeCtx.setTransform(dpr,0,0,dpr,0,0);if(!running)clearScope()}
function clearScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#f58ab3";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke()}
function drawScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);if(running){scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();const n=recordScope.length;for(let i=0;i<n;i++){const idx=(recordScopeWrite+i)%n,s=recordScope[idx],x=i/(n-1)*w,y=h*.5-s*(h*.45/CEILING);i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y)}scopeCtx.stroke()}scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();if(running)drawHandle=requestAnimationFrame(drawScope)}

tapeSpeed.addEventListener("input",()=>{updateReadouts();saveState()});
segmentLength.addEventListener("input",()=>{updateReadouts();saveState()});segmentLength.addEventListener("change",rebuildSegments);
falloff.addEventListener("input",()=>{updateReadouts();saveState()});
micThreshold.addEventListener("input",()=>{updateReadouts();saveState()});
runButton.addEventListener("click",startWorm);window.addEventListener("resize",resizeScope);window.addEventListener("pagehide",()=>{if(running)stopWorm()});
loadState();updateReadouts();requestAnimationFrame(resizeScope);
