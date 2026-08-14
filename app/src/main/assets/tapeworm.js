"use strict";

/* TAPEWORM
   A literal circular tape loop.
   Head order is PLAY -> RECORD -> advance tape.

   - 10 seconds of tape at 1.00x
   - tape speed 0.25x to 4.00x
   - no direct mic monitor
   - no effects
   - FALLOFF is overwrite retention only:
       0%   = keep all old tape and add new recording
       100% = erase old tape as the record head writes new audio
*/

const BASE_LOOP_SECONDS=10;
const STATE_KEY="tapeworm-basic-v3";
const PROCESS_FRAMES=1024;
try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null;
let running=false;
let drawHandle=0;
let processor=null;
let silentKeepAlive=null;
let micStream=null;
let micSource=null;
let inputAnalyser=null;
let nativeUnsubscribe=null;
let nativeMode=false;

let tape=null;
let tapeLength=0;
let head=0;
let nativeQueue=[];
let nativeQueueOffset=0;

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
  const i0=Math.floor(pos)%tapeLength;
  const i1=(i0+1)%tapeLength;
  const f=pos-Math.floor(pos);
  return tape[i0]*(1-f)+tape[i1]*f;
}

function writeTape(pos,value,keep){
  const base=Math.floor(pos);
  const i0=((base%tapeLength)+tapeLength)%tapeLength;
  const i1=(i0+1)%tapeLength;
  const f=pos-base;

  // PLAY has already happened for this tape position. RECORD happens now.
  // At 100% falloff, keep=0, so old tape is replaced rather than regenerated.
  const target0=tape[i0]*keep+value;
  const target1=tape[i1]*keep+value;
  tape[i0]=tape[i0]*(f)+target0*(1-f);
  tape[i1]=tape[i1]*(1-f)+target1*f;

  // Prevent additive overdub from numerically running away at 0% falloff.
  tape[i0]=Math.max(-1,Math.min(1,tape[i0]));
  tape[i1]=Math.max(-1,Math.min(1,tape[i1]));
}

function buildTapeEngine(){
  tapeLength=Math.max(1,Math.round(ctx.sampleRate*BASE_LOOP_SECONDS));
  tape=new Float32Array(tapeLength);
  head=0;
  clearNativeQueue();

  processor=ctx.createScriptProcessor(PROCESS_FRAMES,1,1);
  processor.onaudioprocess=e=>{
    if(!running)return;
    const input=e.inputBuffer.numberOfChannels?e.inputBuffer.getChannelData(0):null;
    const output=e.outputBuffer.getChannelData(0);
    const step=speed();
    const keep=retention();

    for(let i=0;i<output.length;i++){
      // HEAD 1: PLAY. Hear what was on this tape position before recording.
      const old=readTape(head);
      output[i]=old;

      // HEAD 2: RECORD. Overwrite/mix fresh mic only after playback.
      const fresh=nativeMode?pullNativeSample():(input?input[i]:0);
      writeTape(head,fresh,keep);

      // Move the physical tape past both heads.
      head+=step;
      while(head>=tapeLength)head-=tapeLength;
    }
  };

  // Keep processor alive and send only its tape playback to the speaker.
  silentKeepAlive=ctx.createGain();
  silentKeepAlive.gain.value=1;
  processor.connect(ctx.destination);
}

async function startInput(){
  nativeMode=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    try{
      micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      micSource=ctx.createMediaStreamSource(micStream);
      inputAnalyser=ctx.createAnalyser();inputAnalyser.fftSize=1024;inputAnalyser.smoothingTimeConstant=0;
      micSource.connect(inputAnalyser);
      micSource.connect(processor);
      statusEl.textContent="TAPE RUNNING // DIRECT MIC";
      return;
    }catch(e){console.warn("direct mic failed, using native fallback",e)}
  }

  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;
    inputAnalyser=null;
    nativeUnsubscribe=MultiSynthNativeMic.subscribe(pcm=>pushNative(pcm));
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
    // ScriptProcessor needs an input connection even though native samples come through JS.
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
    statusEl.textContent=statusEl.textContent||"TAPE RUNNING";
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
  ctx=null;inputAnalyser=null;tape=null;tapeLength=0;head=0;
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
  if(running&&inputAnalyser){
    const data=new Uint8Array(inputAnalyser.fftSize);inputAnalyser.getByteTimeDomainData(data);
    scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();
    for(let i=0;i<data.length;i++){
      const x=i/(data.length-1)*w,y=data[i]/255*h;
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
