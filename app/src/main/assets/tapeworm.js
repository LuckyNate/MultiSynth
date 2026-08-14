"use strict";

/* TAPEWORM
   One continuous microphone stream feeds one tape-delay circuit.
   WebView getUserMedia is primary; Android PCM is fallback only.
   The scope is tapped directly from the live microphone input bus. */

const BASE_DELAY_SECONDS=15;
const MAX_DELAY_SECONDS=62;
const NATIVE_LEAD_SECONDS=0.12;
const STATE_KEY="tapeworm-state-v3";

let ctx=null,running=false,drawHandle=0;
let inputBus=null,inputAnalyser=null,delay=null,tapeFilter=null,tapeSaturation=null,feedbackGain=null,dryGain=null,echoGain=null,outputGain=null;
let wowOsc=null,wowDepth=null,flutterOsc=null,flutterDepth=null,hissSource=null,hissGain=null;
let micStream=null,micSource=null,nativeUnsubscribe=null,nativeMode=false,nextNativeTime=0,nativeSources=new Set();

const ids=["inputLevel","tapeSpeed","feedback","dryLevel","echoLevel","wow","flutter","wear","outputLevel"];
const controls=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
const statusEl=document.getElementById("status");
const runButton=document.getElementById("runButton");
const speedReadout=document.getElementById("speedReadout");
const feedbackReadout=document.getElementById("feedbackReadout");
const scope=document.getElementById("scope");
const scopeCtx=scope.getContext("2d");

function raw(id){return Number(controls[id].value)}
function clamp01(x){return Math.max(0,Math.min(1,x))}
function taper01(x){return Math.pow(clamp01(x),2)}
function norm(id){const el=controls[id],lo=Number(el.min),hi=Number(el.max);return taper01((raw(id)-lo)/(hi-lo))}
function inputAmount(){return 0.25+norm("inputLevel")*0.75}
function dryAmount(){return norm("dryLevel")}
function echoAmount(){return norm("echoLevel")*0.65}
function feedbackAmount(){return norm("feedback")*0.62}
function outputAmount(){return 0.25+norm("outputLevel")*0.75}
function wowAmount(){return norm("wow")}
function flutterAmount(){return norm("flutter")}
function wearAmount(){return norm("wear")}
function speed(){const r=raw("tapeSpeed");if(r===1)return 1;if(r<1){const x=(1-r)/.75;return 1-.75*taper01(x)}const x=(r-1)/3;return 1+3*taper01(x)}
function loopSeconds(){return BASE_DELAY_SECONDS/Math.max(.25,speed())}
function pct(x){return `${Math.round(x*100)}%`}

function updateReadouts(){
  document.getElementById("inputValue").textContent=pct(inputAmount());
  document.getElementById("speedValue").textContent=`${speed().toFixed(2)}×`;
  document.getElementById("feedbackValue").textContent=pct(feedbackAmount());
  document.getElementById("dryValue").textContent=pct(dryAmount());
  document.getElementById("echoValue").textContent=pct(echoAmount());
  document.getElementById("wowValue").textContent=pct(wowAmount());
  document.getElementById("flutterValue").textContent=pct(flutterAmount());
  document.getElementById("wearValue").textContent=pct(wearAmount());
  document.getElementById("outputValue").textContent=pct(outputAmount());
  const s=loopSeconds();
  speedReadout.textContent=`${speed().toFixed(2)}× // ${s>=10?s.toFixed(1):s.toFixed(2)} s LOOP`;
  feedbackReadout.textContent=`FEEDBACK ${Math.round(feedbackAmount()*100)}%`;
}

function saveState(){const state={};ids.forEach(id=>state[id]=controls[id].value);try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch(_){}}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||"null");if(s)ids.forEach(id=>{if(s[id]!==undefined)controls[id].value=s[id]})}catch(_){}}

function saturationCurve(amount){const n=2048,c=new Float32Array(n),drive=1+amount*2.2,norm=Math.tanh(drive);for(let i=0;i<n;i++){const x=i*2/(n-1)-1;c[i]=Math.tanh(x*drive)/norm}return c}
function noiseBuffer(){const n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b}

function buildTape(){
  inputBus=ctx.createGain();
  inputAnalyser=ctx.createAnalyser();inputAnalyser.fftSize=1024;inputAnalyser.smoothingTimeConstant=0;
  delay=ctx.createDelay(MAX_DELAY_SECONDS+.25);
  tapeFilter=ctx.createBiquadFilter();tapeFilter.type="lowpass";
  tapeSaturation=ctx.createWaveShaper();tapeSaturation.oversample="2x";
  feedbackGain=ctx.createGain();dryGain=ctx.createGain();echoGain=ctx.createGain();outputGain=ctx.createGain();

  inputBus.connect(inputAnalyser);
  inputBus.connect(dryGain);dryGain.connect(outputGain);
  inputBus.connect(delay);
  delay.connect(tapeFilter);tapeFilter.connect(tapeSaturation);
  tapeSaturation.connect(echoGain);echoGain.connect(outputGain);
  tapeSaturation.connect(feedbackGain);feedbackGain.connect(delay);

  wowOsc=ctx.createOscillator();wowOsc.type="sine";wowOsc.frequency.value=.45;
  wowDepth=ctx.createGain();wowOsc.connect(wowDepth);wowDepth.connect(delay.delayTime);wowOsc.start();
  flutterOsc=ctx.createOscillator();flutterOsc.type="sine";flutterOsc.frequency.value=6.4;
  flutterDepth=ctx.createGain();flutterOsc.connect(flutterDepth);flutterDepth.connect(delay.delayTime);flutterOsc.start();

  hissSource=ctx.createBufferSource();hissSource.buffer=noiseBuffer();hissSource.loop=true;
  hissGain=ctx.createGain();hissSource.connect(hissGain);hissGain.connect(outputGain);hissSource.start();
  outputGain.connect(ctx.destination);
}

function applyDSP(immediate=false){
  updateReadouts();saveState();if(!ctx)return;
  const now=ctx.currentTime,t=immediate?.001:.08;
  inputBus.gain.setTargetAtTime(inputAmount(),now,t);
  dryGain.gain.setTargetAtTime(dryAmount(),now,t);
  echoGain.gain.setTargetAtTime(echoAmount(),now,t);
  feedbackGain.gain.setTargetAtTime(feedbackAmount(),now,t);
  outputGain.gain.setTargetAtTime(outputAmount(),now,t);
  const seconds=loopSeconds(),wow=wowAmount(),flutter=flutterAmount(),wear=wearAmount();
  delay.delayTime.setTargetAtTime(seconds,now,.18);
  wowDepth.gain.setTargetAtTime(wow*Math.min(seconds*.0018,.055),now,.12);
  flutterDepth.gain.setTargetAtTime(flutter*Math.min(seconds*.00035,.008),now,.12);
  tapeFilter.frequency.setTargetAtTime(19500-wear*6500,now,.12);
  tapeFilter.Q.setTargetAtTime(.08+wear*.08,now,.12);
  tapeSaturation.curve=saturationCurve(wear);
  hissGain.gain.setTargetAtTime(wear*.0007,now,.12);
}

function scheduleNativePCM(pcm,sampleRate){
  if(!running||!nativeMode||!ctx||!pcm||!pcm.length)return;
  const sr=Number(sampleRate)||48000,b=ctx.createBuffer(1,pcm.length,sr);b.copyToChannel(pcm,0);
  const src=ctx.createBufferSource();src.buffer=b;src.connect(inputBus);
  const now=ctx.currentTime;if(nextNativeTime<now+.025)nextNativeTime=now+NATIVE_LEAD_SECONDS;
  src.start(nextNativeTime);nextNativeTime+=b.duration;nativeSources.add(src);
  src.onended=()=>{nativeSources.delete(src);try{src.disconnect()}catch(_){}};
}

async function startInput(){
  nativeMode=false;
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    try{
      micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      micSource=ctx.createMediaStreamSource(micStream);micSource.connect(inputBus);
      statusEl.textContent="TAPE RUNNING // DIRECT MIC";
      return;
    }catch(e){console.warn("Direct microphone failed; trying native fallback",e)}
  }
  if(window.MultiSynthNativeMic&&window.AndroidMidi&&typeof AndroidMidi.startMic==="function"){
    nativeMode=true;nextNativeTime=ctx.currentTime+NATIVE_LEAD_SECONDS;
    nativeUnsubscribe=MultiSynthNativeMic.subscribe(scheduleNativePCM);
    if(!MultiSynthNativeMic.start())throw new Error("Native microphone unavailable");
    statusEl.textContent="TAPE RUNNING // NATIVE MIC";
    return;
  }
  throw new Error("Microphone unavailable");
}

async function startTape(){
  if(running){await stopTape();return}
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error("Web Audio unavailable");
    ctx=new A({latencyHint:"interactive"});await ctx.resume();buildTape();running=true;applyDSP(true);
    await startInput();runButton.textContent="STOP TAPE";runButton.classList.add("active");drawScope();
  }catch(e){console.error(e);statusEl.textContent="INPUT ERROR";await stopTape(true)}
}

async function stopTape(preserveError=false){
  running=false;cancelAnimationFrame(drawHandle);
  if(nativeUnsubscribe){try{nativeUnsubscribe()}catch(_){}nativeUnsubscribe=null}
  if(window.MultiSynthNativeMic){try{MultiSynthNativeMic.stop()}catch(_){}}
  nativeSources.forEach(s=>{try{s.stop();s.disconnect()}catch(_){}});nativeSources.clear();nextNativeTime=0;nativeMode=false;
  if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;micSource=null;
  try{wowOsc&&wowOsc.stop()}catch(_){}try{flutterOsc&&flutterOsc.stop()}catch(_){}try{hissSource&&hissSource.stop()}catch(_){}
  if(ctx&&ctx.state!=="closed")try{await ctx.close()}catch(_){}
  ctx=inputBus=inputAnalyser=delay=tapeFilter=tapeSaturation=feedbackGain=dryGain=echoGain=outputGain=null;
  wowOsc=wowDepth=flutterOsc=flutterDepth=hissSource=hissGain=null;
  runButton.textContent="START TAPE";runButton.classList.remove("active");if(!preserveError)statusEl.textContent="STOPPED";clearScope();
}

function resizeScope(){const dpr=window.devicePixelRatio||1,r=scope.getBoundingClientRect();scope.width=Math.max(1,Math.floor(r.width*dpr));scope.height=Math.max(1,Math.floor(r.height*dpr));scopeCtx.setTransform(dpr,0,0,dpr,0,0);if(!running)clearScope()}
function clearScope(){const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#f58ab3";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke()}
function drawScope(){if(!running||!inputAnalyser)return;const d=new Uint8Array(inputAnalyser.fftSize);inputAnalyser.getByteTimeDomainData(d);const w=scope.clientWidth,h=scope.clientHeight;scopeCtx.fillStyle="#fff4ef";scopeCtx.fillRect(0,0,w,h);scopeCtx.strokeStyle="#ffd84a";scopeCtx.lineWidth=3;scopeCtx.beginPath();for(let i=0;i<d.length;i++){const x=i/(d.length-1)*w,y=d[i]/255*h;i?scopeCtx.lineTo(x,y):scopeCtx.moveTo(x,y)}scopeCtx.stroke();scopeCtx.strokeStyle="#c83f78";scopeCtx.lineWidth=1;scopeCtx.beginPath();scopeCtx.moveTo(0,h/2);scopeCtx.lineTo(w,h/2);scopeCtx.stroke();drawHandle=requestAnimationFrame(drawScope)}

ids.forEach(id=>controls[id].addEventListener("input",()=>applyDSP(false)));
runButton.addEventListener("click",startTape);
window.addEventListener("resize",resizeScope);
window.addEventListener("pagehide",()=>{if(running)stopTape()});
loadState();updateReadouts();requestAnimationFrame(resizeScope);
