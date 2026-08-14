"use strict";

/* TAPEWORM — fixed 32-tooth segmented live PCM chain.
   MIC CAPTURE and PLAYBACK have independent clocks.
   The mic is sampled continuously in real time into complete grains.
   Completed mic grains queue for the next tooth replacement.
   Per playback tooth: PLAY -> FALLOFF old tooth -> add next complete MIC grain -> STORE.
*/
const SEGMENTS=32, MIN_SEGMENT_MS=50, MAX_SEGMENT_MS=500;
const STATE_KEY="tapeworm-granular-v3", PROCESS_FRAMES=1024, CEILING=.92;
const GATE_HOLD_SECONDS=.10,GATE_ATTACK_SECONDS=.003,GATE_RELEASE_SECONDS=.035;
const MAX_INPUT_QUEUE=128;
try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null,running=false,drawHandle=0,processor=null,silentKeepAlive=null;
let micStream=null,micSource=null,nativeUnsubscribe=null,nativeMode=false,nativeQueue=[],nativeQueueOffset=0;
let grains=[],maxSamples=0,tooth=0,phase=0,activeSamples=0;
let micCapture=null,micCapturePos=0,micCaptureSamples=0,inputGrainQueue=[];
let gateEnv=0,gateGain=0,gateHold=0,recordScope=new Float32Array(PROCESS_FRAMES),recordScopeWrite=0;

const tapeSpeed=document.getElementById("tapeSpeed"),segmentLength=document.getElementById("segmentLength"),falloff=document.getElementById("falloff"),micThreshold=document.getElementById("micThreshold"),speedValue=document.getElementById("speedValue"),segmentValue=document.getElementById("segmentValue"),falloffValue=document.getElementById("falloffValue"),thresholdValue=document.getElementById("thresholdValue"),speedReadout=document.getElementById("speedReadout"),segmentReadout=document.getElementById("segmentReadout"),runButton=document.getElementById("runButton"),statusEl=document.getElementById("status"),scope=document.getElementById("scope"),scopeCtx=scope.getContext("2d");

function speed(){return Math.max(.125,Math.min(8,Number(tapeSpeed.value)||1))}
function segmentMs(){return Math.max(MIN_SEGMENT_MS,Math.min(MAX_SEGMENT_MS,Number(segmentLength.value)||80))}
function falloffAmount(){return Math.max(0,Math.min(1,Number(falloff.value)||0))}
function threshold(){return Math.max(.02,Math.min(.40,Number(micThreshold.value)||.14))}
function clamp(x){return !Number.isFinite(x)?0:Math.max(-CEILING,Math.min(CEILING,x))}
function desiredSamples(){return ctx?Math.max(1,Math.round(ctx.sampleRate*segmentMs()/1000)):0}
function loopSeconds(){return SEGMENTS*segmentMs()/1000/speed()}
function updateReadouts(){const s=speed(),ms=segmentMs(),f=falloffAmount(),t=threshold(),sec=loopSeconds();speedValue.textContent=`${s.toFixed(3)}×`;segmentValue.textContent=`${Math.round(ms)} ms`;falloffValue.textContent=`${Math.round(f*100)}%`;thresholdValue.textContent=`${Math.round(t*100)}%`;speedReadout.textContent=`${s.toFixed(3)}× // ${sec>=10?sec.toFixed(1):sec.toFixed(2)} s LOOP`;segmentReadout.textContent=`${SEGMENTS} × ${Math.round(ms)} ms`}
function saveState(){try{localStorage.setItem(STATE_KEY,JSON.stringify({speed:tapeSpeed.value,segment:segmentLength.value,falloff:falloff.value,threshold:micThreshold.value}))}catch(_){}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||"null");if(!s)return;if(s.speed!==undefined)tapeSpeed.value=s.speed;if(s.segment!==undefined)segmentLength.value=Math.max(MIN_SEGMENT_MS,Number(s.segment));if(s.falloff!==undefined)falloff.value=s.falloff;if(s.threshold!==undefined)micThreshold.value=s.threshold}catch(_){}}
function clearNativeQueue(){nativeQueue=[];nativeQueueOffset=0}function pushNative(p){if(p&&p.length)nativeQueue.push(p)}function pullNativeSample(){while(nativeQueue.length){const a=nativeQueue[0];if(nativeQueueOffset<a.length)return a[nativeQueueOffset++];nativeQueue.shift();nativeQueueOffset=0}return 0}

function gateMic(x){const sr=ctx?ctx.sampleRate:48000,open=threshold(),close=open*.62,mag=Math.abs(x),ec=mag>gateEnv?Math.exp(-1/(sr*.002)):Math.exp(-1/(sr*.025));gateEnv=ec*gateEnv+(1-ec)*mag;if(gateEnv>=open)gateHold=Math.round(GATE_HOLD_SECONDS*sr);else if(gateHold>0)gateHold--;const on=gateEnv>=open||(gateGain>0&&(gateEnv>=close||gateHold>0)),target=on?1:0,time=target>gateGain?GATE_ATTACK_SECONDS:GATE_RELEASE_SECONDS,c=Math.exp(-1/(sr*time));gateGain=c*gateGain+(1-c)*target;if(gateGain<1e-4)gateGain=0;return clamp(x*gateGain)}

function allocateChain(){
  maxSamples=Math.ceil(ctx.sampleRate*MAX_SEGMENT_MS/1000);
  grains=Array.from({length:SEGMENTS},()=>new Float32Array(maxSamples));
  activeSamples=desiredSamples();tooth=0;phase=0;
  micCaptureSamples=activeSamples;micCapture=new Float32Array(maxSamples);micCapturePos=0;inputGrainQueue=[];
  recordScope.fill(0);recordScopeWrite=0;
}

function finishMicCapture(){
  const n=micCaptureSamples;
  const pcm=new Float32Array(n);pcm.set(micCapture.subarray(0,n));
  inputGrainQueue.push({pcm,length:n});
  // Bound memory if playback is deliberately much slower than recording.
  // Drop oldest unheard input only after a very large backlog rather than ever pausing mic capture.
  if(inputGrainQueue.length>MAX_INPUT_QUEUE)inputGrainQueue.shift();
  micCapture.fill(0,0,n);micCapturePos=0;
  micCaptureSamples=desiredSamples();
}

function captureMicSample(x){
  // This function is called exactly once for every incoming/output audio frame,
  // independent of playback SPEED. The mic therefore never stops recording.
  if(!micCaptureSamples)micCaptureSamples=desiredSamples();
  micCapture[micCapturePos++]=x;
  if(micCapturePos>=micCaptureSamples)finishMicCapture();
}

function sampleQueuedGrain(item,i,targetN){
  if(!item||!item.length)return 0;
  if(targetN===item.length)return item.pcm[Math.min(item.length-1,i)]||0;
  // If SEGMENT changed after this grain was captured, resample the complete captured
  // grain into the new tooth length instead of truncating or leaving holes.
  const p=targetN<=1?0:i*(item.length-1)/(targetN-1),i0=Math.floor(p),i1=Math.min(item.length-1,i0+1),f=p-i0;
  return (item.pcm[i0]||0)+((item.pcm[i1]||0)-(item.pcm[i0]||0))*f;
}

function finishTooth(){
  const old=grains[tooth],keep=1-falloffAmount(),n=activeSamples;
  const fresh=inputGrainQueue.length?inputGrainQueue.shift():null;
  for(let i=0;i<n;i++){
    const newMic=sampleQueuedGrain(fresh,i,n);
    const stored=clamp(old[i]*keep+newMic);
    old[i]=stored;
    recordScope[recordScopeWrite++%recordScope.length]=stored;
  }
  // Clear any tail left from an earlier longer segment so shrinking SEGMENT cannot
  // resurrect stale PCM later.
  for(let i=n;i<maxSamples;i++)old[i]=0;
  tooth=(tooth+1)%SEGMENTS;
  activeSamples=desiredSamples();
  phase=0;
}

function readTooth(){const g=grains[tooth],p=Math.min(activeSamples-1,Math.max(0,phase)),i0=Math.floor(p),i1=Math.min(activeSamples-1,i0+1),f=p-i0;return clamp(g[i0]+(g[i1]-g[i0])*f)}

function buildEngine(){
  allocateChain();clearNativeQueue();gateEnv=gateGain=gateHold=0;
  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null,out=e.outputBuffer.getChannelData(0),step=speed();
    for(let i=0;i<out.length;i++){
      // PLAYBACK CLOCK
      out[i]=readTooth();

      // MIC CLOCK — always one real sample per frame, never sped up or slowed down.
      const raw=clamp(nativeMode?pullNativeSample():(input?input[i]:0));
      captureMicSample(gateMic(raw));

      phase+=step;
      while(phase>=activeSamples){phase-=activeSamples;finishTooth()}
    }
  };
  processor.connect(ctx.destination);
}

async function startInput(){nativeMode=false;if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){try{micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:false,autoGainControl:false}});micSource=ctx.createMediaStreamSource(micStream);micSource.connect(processor);statusEl.textContent="WORM RUNNING // CONTINUOUS MIC";return}catch(e){console.warn("direct mic failed",e)}}if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){nativeMode=true;nativeUnsubscribe=MultiSynthNativeMic.subscribe(p=>pushNative(p));if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");const z=ctx.createConstantSource();z.offset.value=0;z.connect(processor);z.start();silentKeepAlive=z;statusEl.textContent="WORM RUNNING // CONTINUOUS NATIVE MIC";return}throw new Error("Microphone unavailable")}
async function startWorm(){if(running){await stopWorm();return}try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");ctx=new A({latencyHint:"interactive"});await ctx.resume();running=true;buildEngine();await startInput();runButton.textContent="STOP WORM";runButton.classList.add("active");drawScope()}catch(e){console.error(e);statusEl.textContent="INPUT ERROR";await stopWorm(true)}}
async function stopWorm(err=false){running=false;cancelAnimationFrame(drawHandle);if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}if(window.MultiSynthNativeMic)try{MultiSynthNativeMic.stop()}catch(_){}clearNativeQueue();nativeMode=false;if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;try{micSource&&micSource.disconnect()}catch(_){}micSource=null;try{processor&&(processor.onaudioprocess=null,processor.disconnect())}catch(_){}processor=null;try{silentKeepAlive&&silentKeepAlive.stop()}catch(_){}try{silentKeepAlive&&silentKeepAlive.disconnect()}catch(_){}silentKeepAlive=null;if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}ctx=null;grains=[];micCapture=null;inputGrainQueue=[];runButton.textContent="START WORM";runButton.classList.remove("active");if(!err)statusEl.textContent="STOPPED";clearScope()}
function resizeScope(){const d=window.devicePixelRatio||1,r=scope.getBoundingClientRect();scope.width=Math.max(1,Math.floor(r.width*d));scope.height=Math.max(1,Math.floor(r.height*d));scopeCtx.setTransform(d,0,0,d,0,0);if(!running)clearScope()}function clearScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#f58ab3";scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke()}function drawScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);if(running){scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();const n=recordScope.length;for(let i=0;i<n;i++){const idx=(recordScopeWrite+i)%n,s=recordScope[idx],x=i/(n-1)*w,y=h*.5-s*(h*.45/CEILING);i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y)}scopeCtx.stroke()}scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();if(running)drawHandle=requestAnimationFrame(drawScope)}
[tapeSpeed,segmentLength,falloff,micThreshold].forEach(el=>el.addEventListener("input",()=>{updateReadouts();saveState()}));runButton.addEventListener("click",startWorm);window.addEventListener("resize",resizeScope);window.addEventListener("pagehide",()=>{if(running)stopWorm()});loadState();updateReadouts();requestAnimationFrame(resizeScope);
