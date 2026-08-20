"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,Defs=MS.ModuleBuilderDefinitions;
if(!C||!I||!Defs)return;

const model=Defs.require(I.TIME_BANDITS);
const defaults=()=>({...model.defaults});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const DIVIDE=new Map([[0.5,2],[0.25,4],[0.125,8],[0.0625,16],[0.03125,32]]);
const MULTIPLY=new Map([[1,1],[2,2],[4,4],[8,8],[16,16],[32,32]]);

function bpm(u){return clamp(u.state.bpm??model.defaults.bpm,30,300)}
function speed(u){
  const n=Number(u.state.division);
  return DIVIDE.has(n)||MULTIPLY.has(n)?n:1;
}
function packetPeriod(u,p){
  const n=Number(p?.period);
  if(Number.isFinite(n)&&n>0)return Math.max(.001,n);
  const b=Number(p?.bpm);
  return 60/clamp(Number.isFinite(b)&&b>0?b:bpm(u),30,300);
}
function packetTime(u,p){
  const n=Number(p?.time);
  return Number.isFinite(n)&&n>0?n:u.ctx.currentTime+.001;
}

function buildInternalSample(u){
  const c=u.ctx,sr=c.sampleRate,pitch=clamp(u.state.pitch,30,800),decay=clamp(u.state.decay,25,1500)/1000,tone=clamp(u.state.tone,0,100);
  const duration=Math.max(.03,decay+.012),frames=Math.max(2,Math.ceil(duration*sr)),b=c.createBuffer(1,frames,sr),out=b.getChannelData(0);
  let phase=0,lp=0;
  const cutoff=clamp(300+tone*90,120,12000),a=1-Math.exp(-2*Math.PI*cutoff/sr),sweep=Math.min(decay,.18);
  for(let i=0;i<frames;i++){
    const t=i/sr,env=t<.002?t/.002:Math.exp(-Math.max(0,t-.002)*Math.log(10000)/Math.max(.001,decay));
    const k=Math.min(1,t/Math.max(.001,sweep)),freq=pitch*Math.pow(Math.max(25,pitch*.45)/pitch,k);
    phase=(phase+freq/sr)%1;
    const tri=1-4*Math.abs(phase-.5);
    lp+=a*(tri-lp);
    out[i]=clamp(lp*env,-1,1);
  }
  u.internalBuffer=b;
}

function playBuffer(u,t,buffer,level){
  if(!buffer)return;
  const c=u.ctx,s=c.createBufferSource(),g=c.createGain(),when=Math.max(c.currentTime+.001,Number(t)||c.currentTime+.001);
  s.buffer=buffer;
  g.gain.value=clamp(level,0,1);
  s.connect(g).connect(u.voice);
  s.onended=()=>{try{s.disconnect();g.disconnect()}catch(_){}};
  s.start(when);
}
function hit(u,t){
  if(Math.random()*100>clamp(u.state.probability,0,100))return;
  playBuffer(u,t,u.sampleBuffer||u.internalBuffer,clamp(u.state.level,0,100)/100);
}
async function load(u,key){
  u.sampleBuffer=null;
  if(!key)return;
  try{
    const r=await MS.PCMLibrary?.get?.(key);
    if(!r?.data?.length)return;
    const b=u.ctx.createBuffer(1,r.data.length,r.sampleRate);
    b.getChannelData(0).set(r.data);
    u.sampleBuffer=b;
  }catch(e){console.error(I.displayNameFor(I.TIME_BANDITS)+" sample",e)}
}

function resetDivider(u,source){
  if(u.source!==source){u.source=source;u.divideCount=0;}
}
function setLease(u,kind,period){
  const now=u.ctx.currentTime;
  u.externalKind=kind;
  u.externalUntil=now+Math.max(.25,period*2.25);
}
function externalActive(u){return u.externalKind&&u.ctx.currentTime<u.externalUntil}
function clearExpiredExternal(u){
  if(u.externalKind&&u.ctx.currentTime>=u.externalUntil){u.externalKind=null;u.externalUntil=0;u.source=null;u.divideCount=0;}
}
function emit(u,time,period,parent,index){
  hit(u,time);
  MS.DvBus?.send(u.id,{kind:"dv",time,period,bpm:60/period,speed:speed(u),parent:parent||null,substep:index||0});
}
function processPulse(u,p,kind){
  const period=packetPeriod(u,p),time=packetTime(u,p),mode=speed(u),source=String(kind||"internal");
  resetDivider(u,source);
  if(kind!=="internal")setLease(u,kind,period);

  const divisor=DIVIDE.get(mode);
  if(divisor){
    u.divideCount++;
    if(u.divideCount<divisor)return;
    u.divideCount=0;
    emit(u,time,period*divisor,p?.source,0);
    return;
  }

  u.divideCount=0;
  const count=MULTIPLY.get(mode)||1,step=period/count;
  for(let i=0;i<count;i++)emit(u,time+i*step,step,p?.source,i);
}

function create(api){
  const c=api.context,input=c.createGain(),voice=c.createGain(),mix=c.createGain(),output=c.createGain();
  input.connect(mix);voice.connect(mix);mix.connect(output);
  api.setInput(input);api.setOutput(output);
  const u={id:api.instanceId,ctx:c,input,voice,mix,output,state:api.state,sampleBuffer:null,internalBuffer:null,onDv:null,source:null,divideCount:0,externalKind:null,externalUntil:0,followClock:false};
  buildInternalSample(u);
  u.onDv=p=>{
    processPulse(u,p,"dv");
    return null;
  };
  if(api.state.pcmKey)load(u,api.state.pcmKey);
  return u;
}

function setState({runtime,state,patch}){
  const u=runtime.user;if(!u)return;
  u.state=state;
  if("division" in patch){u.divideCount=0;u.source=null;}
  if("pitch" in patch||"decay" in patch||"tone" in patch)buildInternalSample(u);
  if("pcmKey" in patch)load(u,state.pcmKey);
}

function clockStart({runtime},info={}){
  const u=runtime.user;if(!u)return;
  u.followClock=info?.source!==u.id;
  u.source=null;u.divideCount=0;
  if(u.followClock){u.externalKind="clock";u.externalUntil=Infinity;}
}
function clockStop({runtime}){
  const u=runtime.user;if(!u)return;
  u.followClock=false;u.externalKind=null;u.externalUntil=0;u.source=null;u.divideCount=0;
}
function clockTick({runtime},tick={}){
  const u=runtime.user;if(!u)return false;
  const self=tick.source===u.id;

  if(self){
    clearExpiredExternal(u);
    if(externalActive(u))return true;
    if((Number(tick.substep)||0)%4!==0)return true;
    processPulse(u,{time:tick.time,bpm:tick.bpm,period:60/clamp(tick.bpm||bpm(u),30,300),source:u.id},"internal");
    return true;
  }

  if(u.externalKind==="dv"&&externalActive(u))return true;
  const period=packetPeriod(u,tick);
  if(u.followClock){u.externalKind="clock";u.externalUntil=Infinity;}
  processPulse(u,{...tick,period},"clock");
  if(u.followClock){u.externalKind="clock";u.externalUntil=Infinity;}
  return true;
}
function cv({runtime},packet={}){
  const u=runtime.user;
  if(!u||packet.kind!=="trigger")return packet;
  clearExpiredExternal(u);
  if(u.externalKind==="dv"&&externalActive(u))return packet;
  processPulse(u,packet,"cv");
  return null;
}
function destroy({runtime}){
  const u=runtime.user;if(!u)return;
  for(const n of [u.input,u.voice,u.mix,u.output])try{n.disconnect()}catch(_){ }
}

C.define({
  type:I.TIME_BANDITS,
  version:"20-low-level",
  description:"DRUM LINE · SINGLE PULSE ENGINE · INTERNAL BPM CLOCK · CV/DV EXTERNAL TIMING · EXACT POWER-OF-TWO DIVIDE/MULTIPLY",
  defaults:defaults(),resources:["storage"],create,setState,clockStart,clockStop,clockTick,cv,destroy,moduleBuilder:model
});
})(window);
