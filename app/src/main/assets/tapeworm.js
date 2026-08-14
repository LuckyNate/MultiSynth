"use strict";

/* TAPEWORM
   True continuous overwrite loop.
   - 10 second loop at 1.00x
   - speed range 0.25x to 4.00x
   - no direct mic monitor
   - no wow/flutter/wear/hiss/saturation
   - falloff determines how much old tape remains when new audio overwrites it
*/

const BASE_LOOP_SECONDS=10;
const MAX_DELAY_SECONDS=42;
const NATIVE_LEAD_SECONDS=0.12;
const STATE_KEY="tapeworm-basic-v2";
try{localStorage.removeItem("multisynth-autostate:"+location.pathname)}catch(_){}

let ctx=null;
let running=false;
let drawHandle=0;
let inputBus=null;
let inputAnalyser=null;
let delay=null;
let oldTapeGain=null;
let newTapeGain=null;
let outputGain=null;
let micStream=null;
let micSource=null;
let nativeUnsubscribe=null;
let nativeMode=false;
let nextNativeTime=0;
const nativeSources=new Set();

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

function speed(){return Number(tapeSpeed.value)}
function falloffAmount(){return Math.max(0,Math.min(1,Number(falloff.value)))}
function loopSeconds(){return BASE_LOOP_SECONDS/Math.max(.25,speed())}
function retention(){return 1-falloffAmount()}

function updateReadouts(){
  const s=speed();
  const seconds=loopSeconds();
  const f=falloffAmount();
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

function buildLoop(){
  inputBus=ctx.createGain();
  inputBus.gain.value=1;

  inputAnalyser=ctx.createAnalyser();
  inputAnalyser.fftSize=1024;
  inputAnalyser.smoothingTimeConstant=0;
  inputBus.connect(inputAnalyser);

  delay=ctx.createDelay(MAX_DELAY_SECONDS);
  oldTapeGain=ctx.createGain();
  newTapeGain=ctx.createGain();
  outputGain=ctx.createGain();
  outputGain.gain.value=1;
  newTapeGain.gain.value=1;

  // Fresh mic audio always writes to the tape input at full level.
  inputBus.connect(newTapeGain);
  newTapeGain.connect(delay);

  // What is already on the tape comes back once per revolution.
  // FALLOFF determines how much survives before fresh audio overwrites it.
  delay.connect(oldTapeGain);
  oldTapeGain.connect(delay);

  // We hear the tape playback only. There is no direct mic monitor.
  delay.connect(outputGain);
  outputGain.connect(ctx.destination);
}

function applyLoop(immediate=false){
  updateReadouts();
  saveState();
  if(!ctx)return;
  const now=ctx.currentTime;
  delay.delayTime.setTargetAtTime(loopSeconds(),now,immediate?.001:.08);
  oldTapeGain.gain.setTargetAtTime(retention(),now,immediate?.001:.05);
  newTapeGain.gain.setTargetAtTime(1,now,immediate?.001:.05);
}

function scheduleNativePCM(pcm,sampleRate){
  if(!running||!nativeMode||!ctx||!pcm||!pcm.length)return;
  const sr=Number(sampleRate)||48000;
  const buffer=ctx.createBuffer(1,pcm.length,sr);
  buffer.copyToChannel(pcm,0);
  const src=ctx.createBufferSource();
  src.buffer=buffer;
  src.connect(inputBus);
  const now=ctx.currentTime;
  if(nextNativeTime<now+.025)nextNativeTime=now+NATIVE_LEAD_SECONDS;
  src.start(nextNativeTime);
  nextNativeTime+=buffer.duration;
  nativeSources.add(src);
  src.onended=()=>{nativeSources.delete(src);try{src.disconnect()}catch(_){}};
}

async function startInput(){
  nativeMode=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    try{
      micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      micSource=ctx.createMediaStreamSource(micStream);
      micSource.connect(inputBus);
      statusEl.textContent="TAPE RUNNING // DIRECT MIC";
      return;
    }catch(e){console.warn("direct mic failed, using native fallback",e)}
  }
  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;
    nextNativeTime=ctx.currentTime+NATIVE_LEAD_SECONDS;
    nativeUnsubscribe=MultiSynthNativeMic.subscribe(scheduleNativePCM);
    if(!MultiSynthNativeMic.start())throw new Error("Microphone unavailable");
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
    buildLoop();
    running=true;
    applyLoop(true);
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
  nativeSources.forEach(s=>{try{s.stop();s.disconnect()}catch(_){}});
  nativeSources.clear();
  nextNativeTime=0;
  nativeMode=false;
  if(micStream)micStream.getTracks().forEach(t=>t.stop());
  micStream=null;
  micSource=null;
  if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}
  ctx=inputBus=inputAnalyser=delay=oldTapeGain=newTapeGain=outputGain=null;
  runButton.textContent="START TAPE";
  runButton.classList.remove("active");
  if(!preserveError)statusEl.textContent="STOPPED";
  clearScope();
}

function resizeScope(){
  const dpr=window.devicePixelRatio||1;
  const r=scope.getBoundingClientRect();
  scope.width=Math.max(1,Math.floor(r.width*dpr));
  scope.height=Math.max(1,Math.floor(r.height*dpr));
  scopeCtx.setTransform(dpr,0,0,dpr,0,0);
  if(!running)clearScope();
}

function clearScope(){
  const w=scope.clientWidth,h=scope.clientHeight;
  scopeCtx.fillStyle="#fff4ef";
  scopeCtx.fillRect(0,0,w,h);
  scopeCtx.strokeStyle="#f58ab3";
  scopeCtx.lineWidth=1;
  scopeCtx.beginPath();
  scopeCtx.moveTo(0,h/2);
  scopeCtx.lineTo(w,h/2);
  scopeCtx.stroke();
}

function drawScope(){
  if(!running||!inputAnalyser)return;
  const data=new Uint8Array(inputAnalyser.fftSize);
  inputAnalyser.getByteTimeDomainData(data);
  const w=scope.clientWidth,h=scope.clientHeight;
  scopeCtx.fillStyle="#fff4ef";
  scopeCtx.fillRect(0,0,w,h);
  scopeCtx.strokeStyle="#ffd84a";
  scopeCtx.lineWidth=3;
  scopeCtx.beginPath();
  for(let i=0;i<data.length;i++){
    const x=i/(data.length-1)*w;
    const y=data[i]/255*h;
    if(i===0)scopeCtx.moveTo(x,y);else scopeCtx.lineTo(x,y);
  }
  scopeCtx.stroke();
  scopeCtx.strokeStyle="#c83f78";
  scopeCtx.lineWidth=1;
  scopeCtx.beginPath();
  scopeCtx.moveTo(0,h/2);
  scopeCtx.lineTo(w,h/2);
  scopeCtx.stroke();
  drawHandle=requestAnimationFrame(drawScope);
}

tapeSpeed.addEventListener("input",()=>applyLoop(false));
falloff.addEventListener("input",()=>applyLoop(false));
runButton.addEventListener("click",startTape);
window.addEventListener("resize",resizeScope);
window.addEventListener("pagehide",()=>{if(running)stopTape()});

loadState();
updateReadouts();
requestAnimationFrame(resizeScope);
