"use strict";

/* TAPEWORM
   Literal circular tape loop.
   Head order is PLAY -> RECORD -> advance tape.

   - 10 seconds of tape at 1.00x
   - tape speed 0.25x to 4.00x
   - no direct mic monitor
   - no effects
   - FALLOFF controls old-tape retention at the RECORD head
   - scope shows the exact signal written by the RECORD head
   - transparent peak limiting prevents runaway acoustic/overdub buildup
*/

const BASE_LOOP_SECONDS=10;
const STATE_KEY="tapeworm-basic-v4";
const PROCESS_FRAMES=1024;
const WRITE_CEILING=0.92;
const OUTPUT_CEILING=0.92;
try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null;
let running=false;
let drawHandle=0;
let processor=null;
let silentKeepAlive=null;
let micStream=null;
let micSource=null;
let nativeUnsubscribe=null;
let nativeMode=false;

let tape=null;
let tapeLength=0;
let head=0;
let nativeQueue=[];
let nativeQueueOffset=0;
let recordScope=new Float32Array(PROCESS_FRAMES);
let recordScopeWrite=0;

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

function speed(){return Math.max(.25,Math.min(4,Number(tapeSpeed.value)||1))}
function falloffAmount(){return Math.max(0,Math.min(1,Number(falloff.value)||0))}
function retention(){return 1-falloffAmount()}
function loopSeconds(){return BASE_LOOP_SECONDS/speed()}
function clampSample(x,ceiling){
  if(!Number.isFinite(x))return 0;
  if(x>ceiling)return ceiling;
  if(x<-ceiling)return -ceiling;
  return x;
}

function updateReadouts(){
  const s=speed(),f=falloffAmount(),seconds=loopSeconds();
  speedValue.textContent=`${s.toFixed(2)}×`;
  falloffValue.textContent=`${Math.round(f*100)}%`;
  speedReadout.textContent=`${s.toFixed(2)}× // ${seconds>=10?seconds.toFixed(1):seconds.toFixed(2)} s LOOP`;
  falloffReadout.textContent=`FALLOFF ${Math.round(f*100)}%`;
}

function saveState(){
  try{localStorage.setItem(STATE_KEY,JSON.stringify({tapeSpeed:tapeSpeed.value,falloff:falloff.value}))}catch(_){}
}
function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(STATE_KEY)||"null");
    if(!s)return;
    if(s.tapeSpeed!==undefined)tapeSpeed.value=s.tapeSpeed;
    if(s.falloff!==undefined)falloff.value=s.falloff;
  }catch(_){}
}

function clearNativeQueue(){nativeQueue=[];nativeQueueOffset=0}
function pushNative(pcm){if(pcm&&pcm.length)nativeQueue.push(pcm)}
function pullNativeSample(){
  while(nativeQueue.length){
    const first=nativeQueue[0];
    if(nativeQueueOffset<first.length)return first[nativeQueueOffset++];
    nativeQueue.shift();nativeQueueOffset=0;
  }
  return 0;
}

function readTape(pos){
  const base=Math.floor(pos);
  const i0=((base%tapeLength)+tapeLength)%tapeLength;
  const i1=(i0+1)%tapeLength;
  const f=pos-base;
  return tape[i0]*(1-f)+tape[i1]*f;
}

function writeTape(pos,fresh,keep){
  const base=Math.floor(pos);
  const i0=((base%tapeLength)+tapeLength)%tapeLength;
  const i1=(i0+1)%tapeLength;
  const f=pos-base;

  /* PLAY has already happened. RECORD now combines retained tape with fresh mic.
     The combined write is peak-limited before it reaches the tape, so repeated
     overdubs or speaker-to-mic leakage cannot numerically run away into clipping. */
  const oldAtHead=tape[i0]*(1-f)+tape[i1]*f;
  const mixed=oldAtHead*keep+fresh;
  const written=clampSample(mixed,WRITE_CEILING);

  // Write the same head value into the two neighboring samples using interpolation.
  tape[i0]=tape[i0]*f+written*(1-f);
  tape[i1]=tape[i1]*(1-f)+written*f;
  tape[i0]=clampSample(tape[i0],WRITE_CEILING);
  tape[i1]=clampSample(tape[i1],WRITE_CEILING);

  // Scope is the RECORD head, not raw mic and not playback.
  recordScope[recordScopeWrite++%recordScope.length]=written;
  return written;
}

function buildTapeEngine(){
  tapeLength=Math.max(1,Math.round(ctx.sampleRate*BASE_LOOP_SECONDS));
  tape=new Float32Array(tapeLength);
  head=0;
  recordScope.fill(0);
  recordScopeWrite=0;
  clearNativeQueue();

  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null;
    const output=e.outputBuffer.getChannelData(0);
    const step=speed();
    const keep=retention();

    for(let i=0;i<output.length;i++){
      // HEAD 1 — PLAY: hear the tape before this position is rewritten.
      const old=readTape(head);
      output[i]=clampSample(old,OUTPUT_CEILING);

      // HEAD 2 — RECORD: old tape retention + fresh mic, then bounded write.
      const fresh=clampSample(nativeMode?pullNativeSample():(input?input[i]:0),WRITE_CEILING);
      writeTape(head,fresh,keep);

      // Physical tape advances past PLAY then RECORD.
      head+=step;
      while(head>=tapeLength)head-=tapeLength;
    }
  };

  processor.connect(ctx.destination);
}

async function startInput(){
  nativeMode=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    try{
      micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      micSource=ctx.createMediaStreamSource(micStream);
      micSource.connect(processor);
      statusEl.textContent="TAPE RUNNING // DIRECT MIC";
      return;
    }catch(e){console.warn("direct mic failed, using native fallback",e)}
  }

  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;
    nativeUnsubscribe=MultiSynthNativeMic.subscribe(pcm=>pushNative(pcm));
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
    const zero=ctx.createConstantSource();zero.offset.value=0;zero.connect(processor);zero.start();
    silentKeepAlive=zero;
    statusEl.textContent="TAPE RUNNING // NATIVE MIC";
    return;
  }
  throw new Error("Microphone unavailable");
}

async function startTape(){
  if(running){await stopTape();return}
  try{
    const A=window.AudioContext||window.webkitAudioContext;
    if(!A)throw new Error("Web Audio unavailable");
    ctx=new A({latencyHint:"interactive"});
    await ctx.resume();
    running=true;
    buildTapeEngine();
    await startInput();
    runButton.textContent="STOP TAPE";
    runButton.classList.add("active");
    drawScope();
  }catch(e){
    console.error(e);
    statusEl.textContent="INPUT ERROR";
    await stopTape(true);
  }
}

async function stopTape(preserveError=false){
  running=false;
  cancelAnimationFrame(drawHandle);
  if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}
  if(window.MultiSynthNativeMic){try{MultiSynthNativeMic.stop()}catch(_){}}
  clearNativeQueue();nativeMode=false;
  if(micStream)micStream.getTracks().forEach(t=>t.stop());
  micStream=null;
  try{micSource&&micSource.disconnect()}catch(_){}
  micSource=null;
  try{processor&&(processor.onaudioprocess=null,processor.disconnect())}catch(_){}
  processor=null;
  try{silentKeepAlive&&silentKeepAlive.stop&&silentKeepAlive.stop()}catch(_){}
  try{silentKeepAlive&&silentKeepAlive.disconnect&&silentKeepAlive.disconnect()}catch(_){}
  silentKeepAlive=null;
  if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}
  ctx=null;tape=null;tapeLength=0;head=0;recordScope.fill(0);recordScopeWrite=0;
  runButton.textContent="START TAPE";
  runButton.classList.remove("active");
  if(!preserveError)statusEl.textContent="STOPPED";
  clearScope();
}

function resizeScope(){
  const dpr=window.devicePixelRatio||1,r=scope.getBoundingClientRect();
  scope.width=Math.max(1,Math.floor(r.width*dpr));
  scope.height=Math.max(1,Math.floor(r.height*dpr));
  scopeCtx.setTransform(dpr,0,0,dpr,0,0);
  if(!running)clearScope();
}
function clearScope(){
  const w=scope.clientWidth,h=scope.clientHeight;
  scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);
  scopeCtx.strokeStyle="#f58ab3";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();
}
function drawScope(){
  const w=scope.clientWidth,h=scope.clientHeight;
  scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);
  if(running){
    scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();
    const n=recordScope.length;
    for(let i=0;i<n;i++){
      const idx=(recordScopeWrite+i)%n;
      const sample=recordScope[idx];
      const x=i/(n-1)*w;
      const y=h*.5-sample*(h*.45/WRITE_CEILING);
      i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y);
    }
    scopeCtx.stroke();
  }
  scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();
  if(running)drawHandle=requestAnimationFrame(drawScope);
}

tapeSpeed.addEventListener("input",()=>{updateReadouts();saveState()});
falloff.addEventListener("input",()=>{updateReadouts();saveState()});
runButton.addEventListener("click",startTape);
window.addEventListener("resize",resizeScope);
window.addEventListener("pagehide",()=>{if(running)stopTape()});

loadState();updateReadouts();requestAnimationFrame(resizeScope);
