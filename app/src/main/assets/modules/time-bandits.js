"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.RackStandard,Defs=MS.ModuleBuilderDefinitions;if(!C||!I||!S||!Defs)return;
const model=Defs.require(I.TIME_BANDITS),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const defaults=()=>({...model.defaults});
function buildInternalSample(u){const c=u.ctx,sr=c.sampleRate,pitch=clamp(u.state.pitch,30,800),decay=clamp(u.state.decay,25,1500)/1000,tone=clamp(u.state.tone,0,100),duration=Math.max(.03,decay+.012),frames=Math.max(2,Math.ceil(duration*sr)),b=c.createBuffer(1,frames,sr),out=b.getChannelData(0);let phase=0,lp=0;const cutoff=clamp(300+tone*90,120,12000),a=1-Math.exp(-2*Math.PI*cutoff/sr),sweep=Math.min(decay,.18);for(let i=0;i<frames;i++){const t=i/sr,env=t<.002?t/.002:Math.exp(-Math.max(0,t-.002)*Math.log(10000)/Math.max(.001,decay)),k=Math.min(1,t/Math.max(.001,sweep)),freq=pitch*Math.pow(Math.max(25,pitch*.45)/pitch,k);phase=(phase+freq/sr)%1;const tri=1-4*Math.abs(phase-.5);lp+=a*(tri-lp);out[i]=clamp(lp*env,-1,1)}u.internalBuffer=b}
function playBuffer(u,t,buffer,level=1){if(!buffer)return;const c=u.ctx,s=c.createBufferSource(),g=c.createGain(),when=Math.max(c.currentTime,Number(t)||c.currentTime);s.buffer=buffer;g.gain.value=clamp(level,0,1);s.connect(g).connect(u.voice);s.onended=()=>{try{s.disconnect();g.disconnect()}catch(_){}};s.start(when)}
function hit(u,t){if(Math.random()*100>clamp(u.state.probability,0,100))return;playBuffer(u,t,u.sampleBuffer||u.internalBuffer,clamp(u.state.level,0,100)/100)}
async function load(u,key){u.sampleBuffer=null;if(!key)return;const L=MS.PCMLibrary;try{const r=await L?.get?.(key);if(!r?.data?.length)return;const b=u.ctx.createBuffer(1,r.data.length,r.sampleRate);b.getChannelData(0).set(r.data);u.sampleBuffer=b}catch(e){console.error(I.displayNameFor(I.TIME_BANDITS)+" sample",e)}}
function bpm(u){return clamp(u.state.bpm??model.defaults.bpm,30,300)}
function speed(u){const n=Number(u.state.division);return[0.03125,0.0625,0.125,0.25,0.5,1,2,4,8,16,32].includes(n)?n:1}
function internalInterval(u){return(60/bpm(u))/speed(u)}
function emitDv(u,time,period,parent,index=0){hit(u,time);MS.DvBus?.send(u.id,{kind:"dv",time,period,bpm:60/period,speed:speed(u),parent:parent||null,substep:index})}
function clearMult(u){for(const id of u.multTimers)clearTimeout(id);u.multTimers.length=0}
function emitAt(u,target,period,parent,index){const delay=Math.max(0,(target-u.ctx.currentTime)*1000);if(delay<=1){emitDv(u,u.ctx.currentTime,period,parent,index);return}const id=setTimeout(()=>{u.multTimers=u.multTimers.filter(x=>x!==id);emitDv(u,u.ctx.currentTime,period,parent,index)},delay);u.multTimers.push(id)}
function pulse(u,p={},source="cv"){
 const ratio=speed(u),time=Number(p.time)||u.ctx.currentTime,packetPeriod=Math.max(.001,Number(p.period)||60/(Number(p.bpm)||bpm(u))),measured=u.lastInputTime!=null&&time>u.lastInputTime?time-u.lastInputTime:0,period=measured>.001?measured:(u.lastPeriod||packetPeriod);
 u.lastInputTime=time;u.lastPeriod=period;clearMult(u);
 if(source==="dv"){u.dvSeen=true}else if(u.dvSeen)return;
 if(ratio<1){const n=Math.round(1/ratio);u.count=(u.count+1)&31;if((u.count%n)===0)emitDv(u,time,period*n,p.source||null);return}
 u.count=0;
 if(ratio===1){emitDv(u,time,period,p.source||null);return}
 const n=Math.round(ratio),step=period/n;for(let i=0;i<n;i++)emitAt(u,time+i*step,step,p.source||null,i)
}
function clearInternalTimer(u){if(u.internalTimer){clearTimeout(u.internalTimer);u.internalTimer=null}}
function armInternal(u,delaySec){clearInternalTimer(u);if(u.dvSeen||u.externalSeen)return;u.internalTimer=setTimeout(()=>{u.internalTimer=null;if(u.dvSeen||u.externalSeen)return;const now=performance.now();u.lastInternalMs=now;const interval=internalInterval(u);u.internalIntervalSec=interval;emitDv(u,u.ctx.currentTime,interval,u.id);armInternal(u,interval)},Math.max(1,delaySec*1000))}
function startInternal(u,fireNow=true){u.externalSeen=false;u.dvSeen=false;clearInternalTimer(u);clearMult(u);u.lastInputTime=null;const interval=internalInterval(u);u.internalIntervalSec=interval;u.lastInternalMs=performance.now();if(fireNow)emitDv(u,u.ctx.currentTime,interval,u.id);armInternal(u,interval)}
function stopInternal(u){clearInternalTimer(u)}
function retimeInternal(u,oldInterval){if(u.dvSeen||u.externalSeen)return;const now=performance.now(),elapsed=Math.max(0,(now-u.lastInternalMs)/1000),old=Math.max(.001,Number(oldInterval)||u.internalIntervalSec||internalInterval(u)),phase=clamp(elapsed/old,0,.999999),next=internalInterval(u);u.internalIntervalSec=next;armInternal(u,next*(1-phase))}
function create(api){const c=api.context,input=c.createGain(),voice=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);voice.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);const u={id:api.instanceId,ctx:c,input,voice,mix,output,state:api.state,sampleBuffer:null,internalBuffer:null,onDv:null,onDiv:null,lastPeriod:null,lastInputTime:null,count:0,dvSeen:false,externalSeen:false,internalTimer:null,lastInternalMs:0,internalIntervalSec:0,multTimers:[]};buildInternalSample(u);u.onDv=p=>{u.dvSeen=true;u.externalSeen=true;stopInternal(u);pulse(u,p,"dv");return null};u.onDiv=u.onDv;if(api.state.pcmKey)load(u,api.state.pcmKey);startInternal(u,true);return u}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;const oldInterval=internalInterval(u);u.state=state;if("bpm" in patch||"division" in patch){u.count=0;retimeInternal(u,oldInterval)}if("pitch" in patch||"decay" in patch||"tone" in patch)buildInternalSample(u);if("pcmKey" in patch)load(u,state.pcmKey)}
function clockStart({runtime}){const u=runtime.user;if(!u)return;u.count=0;startInternal(u,true)}
function clockStop({runtime}){const u=runtime.user;if(!u)return;stopInternal(u);clearMult(u);u.count=0;u.dvSeen=false;u.externalSeen=false;u.lastInputTime=null}
function clockTick({runtime},tick){const u=runtime.user;if(!u||u.dvSeen)return true;u.externalSeen=true;stopInternal(u);pulse(u,{kind:"clock",time:tick?.time,bpm:tick?.bpm,period:tick?.period||60/Math.max(30,Math.min(300,Number(tick?.bpm)||120)),source:tick?.source},"cv");return true}
function cv({runtime},packet){const u=runtime.user;if(packet?.kind!=="trigger"||!u)return packet;if(u.dvSeen)return packet;u.externalSeen=true;stopInternal(u);pulse(u,packet,"cv");return null}
function destroy({runtime}){const u=runtime.user;if(!u)return;stopInternal(u);clearMult(u);for(const n of [u.input,u.voice,u.mix,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.TIME_BANDITS,version:"15",description:"MEASURED-PULSE MULTIPLIER · REAL-TIME DV EMISSION · PERFORMANCE RETEMPO · PREBUILT PCM · DV PRIORITY",defaults:defaults(),resources:["storage"],create,setState,clockStart,clockStop,clockTick,cv,destroy,moduleBuilder:model});
})(window);
