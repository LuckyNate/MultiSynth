"use strict";

const BASE_DELAY_SECONDS = 15;
const MAX_LOOP_SECONDS = 60;
const MAX_DELAY_SECONDS = 62;

let ctx = null;
let micStream = null;
let micSource = null;
let inputGain = null;
let delay = null;
let tapeFilter = null;
let tapeSaturation = null;
let feedbackGain = null;
let dryGain = null;
let echoGain = null;
let outputGain = null;
let analyser = null;
let wowOsc = null;
let wowDepth = null;
let flutterOsc = null;
let flutterDepth = null;
let hissSource = null;
let hissGain = null;
let running = false;
let drawHandle = 0;

const ids = ["inputLevel","tapeSpeed","feedback","dryLevel","echoLevel","wow","flutter","wear","outputLevel"];
const controls = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const statusEl = document.getElementById("status");
const runButton = document.getElementById("runButton");
const speedReadout = document.getElementById("speedReadout");
const feedbackReadout = document.getElementById("feedbackReadout");
const scope = document.getElementById("scope");
const scopeCtx = scope.getContext("2d");

function value(id){ return Number(controls[id].value); }
function pct(v){ return `${Math.round(v * 100)}%`; }
function loopSeconds(){ return Math.min(MAX_LOOP_SECONDS, BASE_DELAY_SECONDS / Math.max(.25,value("tapeSpeed"))); }

function updateReadouts(){
  document.getElementById("inputValue").textContent = pct(value("inputLevel"));
  document.getElementById("speedValue").textContent = `${value("tapeSpeed").toFixed(2)}×`;
  document.getElementById("feedbackValue").textContent = pct(value("feedback"));
  document.getElementById("dryValue").textContent = pct(value("dryLevel"));
  document.getElementById("echoValue").textContent = pct(value("echoLevel"));
  document.getElementById("wowValue").textContent = pct(value("wow"));
  document.getElementById("flutterValue").textContent = pct(value("flutter"));
  document.getElementById("wearValue").textContent = pct(value("wear"));
  document.getElementById("outputValue").textContent = pct(value("outputLevel"));
  const seconds=loopSeconds();
  speedReadout.textContent = `${value("tapeSpeed").toFixed(2)}× // ${seconds>=10?seconds.toFixed(1):seconds.toFixed(2)} s LOOP`;
  feedbackReadout.textContent = `FEEDBACK ${Math.round(value("feedback") * 100)}%`;
}

function makeSaturationCurve(amount){
  const n = 2048;
  const curve = new Float32Array(n);
  const drive = 1 + amount * 10;
  const norm = Math.tanh(drive);
  for(let i=0;i<n;i++){
    const x = i * 2 / (n - 1) - 1;
    curve[i] = Math.tanh(x * drive) / norm;
  }
  return curve;
}

function makeNoiseBuffer(context){
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<length;i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function applyDSP(immediate=false){
  updateReadouts();
  saveState();
  if(!ctx) return;
  const now = ctx.currentTime;
  const tau = immediate ? 0.001 : 0.025;
  inputGain.gain.setTargetAtTime(value("inputLevel"), now, tau);
  dryGain.gain.setTargetAtTime(value("dryLevel"), now, tau);
  echoGain.gain.setTargetAtTime(value("echoLevel"), now, tau);
  feedbackGain.gain.setTargetAtTime(value("feedback"), now, tau);
  outputGain.gain.setTargetAtTime(value("outputLevel"), now, tau);
  const loopTime = loopSeconds();
  delay.delayTime.setTargetAtTime(loopTime, now, 0.08);
  wowDepth.gain.setTargetAtTime(value("wow") * Math.min(loopTime * 0.018, .9), now, 0.03);
  flutterDepth.gain.setTargetAtTime(value("flutter") * Math.min(loopTime * 0.004, .18), now, 0.03);
  const wear = value("wear");
  tapeFilter.frequency.setTargetAtTime(18000 - wear * 15000, now, 0.03);
  tapeFilter.Q.setTargetAtTime(0.15 + wear * 0.35, now, 0.03);
  tapeSaturation.curve = makeSaturationCurve(wear);
  hissGain.gain.setTargetAtTime(wear * 0.012, now, 0.04);
}

async function startTape(){
  if(running) return stopTape();
  try{
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContextClass({latencyHint:"interactive"});
    await ctx.resume();
    micStream = await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    micSource = ctx.createMediaStreamSource(micStream);
    inputGain = ctx.createGain();
    delay = ctx.createDelay(MAX_DELAY_SECONDS);
    tapeFilter = ctx.createBiquadFilter();
    tapeFilter.type = "lowpass";
    tapeSaturation = ctx.createWaveShaper();
    tapeSaturation.oversample = "2x";
    feedbackGain = ctx.createGain();
    dryGain = ctx.createGain();
    echoGain = ctx.createGain();
    outputGain = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    micSource.connect(inputGain);
    inputGain.connect(dryGain); dryGain.connect(outputGain);
    inputGain.connect(delay); delay.connect(tapeFilter); tapeFilter.connect(tapeSaturation); tapeSaturation.connect(echoGain); echoGain.connect(outputGain);
    tapeSaturation.connect(feedbackGain); feedbackGain.connect(delay);
    wowOsc = ctx.createOscillator(); wowOsc.type = "sine"; wowOsc.frequency.value = 0.55; wowDepth = ctx.createGain(); wowOsc.connect(wowDepth); wowDepth.connect(delay.delayTime); wowOsc.start();
    flutterOsc = ctx.createOscillator(); flutterOsc.type = "sine"; flutterOsc.frequency.value = 7.3; flutterDepth = ctx.createGain(); flutterOsc.connect(flutterDepth); flutterDepth.connect(delay.delayTime); flutterOsc.start();
    hissSource = ctx.createBufferSource(); hissSource.buffer = makeNoiseBuffer(ctx); hissSource.loop = true; hissGain = ctx.createGain(); hissSource.connect(hissGain); hissGain.connect(tapeFilter); hissSource.start();
    outputGain.connect(analyser); analyser.connect(ctx.destination);
    running = true;
    runButton.textContent = "STOP TAPE";
    runButton.classList.add("active");
    statusEl.textContent = "TAPE RUNNING";
    applyDSP(true);
    drawScope();
  }catch(error){ console.error(error); statusEl.textContent = "INPUT ERROR"; await stopTape(); }
}

async function stopTape(){
  running = false;
  cancelAnimationFrame(drawHandle);
  try{ if(wowOsc) wowOsc.stop(); }catch(_){}
  try{ if(flutterOsc) flutterOsc.stop(); }catch(_){}
  try{ if(hissSource) hissSource.stop(); }catch(_){}
  if(micStream) micStream.getTracks().forEach(track => track.stop());
  if(ctx && ctx.state !== "closed") await ctx.close();
  ctx = micStream = micSource = inputGain = delay = tapeFilter = tapeSaturation = null;
  feedbackGain = dryGain = echoGain = outputGain = analyser = null;
  wowOsc = wowDepth = flutterOsc = flutterDepth = hissSource = hissGain = null;
  runButton.textContent = "START TAPE";
  runButton.classList.remove("active");
  if(statusEl.textContent !== "INPUT ERROR") statusEl.textContent = "STOPPED";
  clearScope();
}

function resizeScope(){ const dpr=window.devicePixelRatio||1,rect=scope.getBoundingClientRect(); scope.width=Math.max(1,Math.floor(rect.width*dpr)); scope.height=Math.max(1,Math.floor(rect.height*dpr)); scopeCtx.setTransform(dpr,0,0,dpr,0,0); if(!running)clearScope(); }
function clearScope(){ const w=scope.clientWidth,h=scope.clientHeight; scopeCtx.fillStyle="#fff4ef"; scopeCtx.fillRect(0,0,w,h); scopeCtx.strokeStyle="#f58ab3"; scopeCtx.lineWidth=1; scopeCtx.beginPath(); scopeCtx.moveTo(0,h/2); scopeCtx.lineTo(w,h/2); scopeCtx.stroke(); }
function drawScope(){ if(!running||!analyser)return; const data=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data); const w=scope.clientWidth,h=scope.clientHeight; scopeCtx.fillStyle="#fff4ef"; scopeCtx.fillRect(0,0,w,h); scopeCtx.strokeStyle="#ffd84a"; scopeCtx.lineWidth=3; scopeCtx.beginPath(); for(let i=0;i<data.length;i++){const x=i/(data.length-1)*w,y=data[i]/255*h;i===0?scopeCtx.moveTo(x,y):scopeCtx.lineTo(x,y)} scopeCtx.stroke(); scopeCtx.strokeStyle="#c83f78"; scopeCtx.lineWidth=1; scopeCtx.beginPath(); scopeCtx.moveTo(0,h/2); scopeCtx.lineTo(w,h/2); scopeCtx.stroke(); drawHandle=requestAnimationFrame(drawScope); }
function saveState(){ const state={}; ids.forEach(id=>state[id]=controls[id].value); try{localStorage.setItem("tapeworm-state",JSON.stringify(state));}catch(_){} }
function loadState(){ try{const state=JSON.parse(localStorage.getItem("tapeworm-state")||"null");if(state)ids.forEach(id=>{if(state[id]!==undefined)controls[id].value=state[id]});}catch(_){} }
ids.forEach(id=>controls[id].addEventListener("input",()=>applyDSP(false)));
runButton.addEventListener("click",startTape);
window.addEventListener("resize",resizeScope);
window.addEventListener("pagehide",()=>{if(running)stopTape();});
loadState(); updateReadouts(); requestAnimationFrame(resizeScope);
