"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.RackStandard,Defs=MS.ModuleBuilderDefinitions;if(!C||!I||!S||!Defs)return;
const model=Defs.require(I.TIME_BANDITS),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),LOOKAHEAD=.045;
const defaults=()=>({...model.defaults});
function buildInternalSample(u){const c=u.ctx,sr=c.sampleRate,pitch=clamp(u.state.pitch,30,800),decay=clamp(u.state.decay,25,1500)/1000,tone=clamp(u.state.tone,0,100),duration=Math.max(.03,decay+.012),frames=Math.max(2,Math.ceil(duration*sr)),b=c.createBuffer(1,frames,sr),out=b.getChannelData(0);let phase=0,lp=0;const cutoff=clamp(300+tone*90,120,12000),a=1-Math.exp(-2*Math.PI*cutoff/sr),sweep=Math.min(decay,.18);for(let i=0;i<frames;i++){const t=i/sr,env=t<.002?t/.002:Math.exp(-Math.max(0,t-.002)*Math.log(10000)/Math.max(.001,decay)),k=Math.min(1,t/Math.max(.001,sweep)),freq=pitch*Math.pow(Math.max(25,pitch*.45)/pitch,k);phase=(phase+freq/sr)%1;const tri=1-4*Math.abs(phase-.5);lp+=a*(tri-lp);out[i]=clamp(lp*env,-1,1)}u.internalBuffer=b}
function playBuffer(u,t,buffer,level=1){if(!buffer)return;const c=u.ctx,s=c.createBufferSource(),g=c.createGain(),now=Math.max(c.currentTime+.001,Number(t)||c.currentTime+.001);s.buffer=buffer;g.gain.value=clamp(level,0,1);s.connect(g).connect(u.voice);s.onended=()=>{try{s.disconnect();g.disconnect()}catch(_){}};s.start(now)}
function hit(u,t){if(Math.random()*100>clamp(u.state.probability,0,100))return;playBuffer(u,t,u.sampleBuffer||u.internalBuffer,clamp(u.state.level,0,100)/100)}
async function load(u,key){u.sampleBuffer=null;if(!key)return;const L=MS.PCMLibrary;try{const r=await L?.get?.(key);if(!r?.data?.length)return;const b=u.ctx.createBuffer(1,r.data.length,r.sampleRate);b.getChannelData(0).set(r.data);u.sampleBuffer=b}catch(e){console.error(I.displayNameFor(I.TIME_BANDITS)+" sample",e)}}
function bpm(u){return clamp(u.state.bpm??model.defaults.bpm,30,300)}
function speed(u){const n=Number(u.state.division);return[0.03125,0.0625,0.125,0.25,0.5,1,2,4,8,16,32].includes(n)?n:1}
function markExternal(u,span){u.externalUntil=performance.now()+Math.max(250,Math.max(.02,Number(span)||.5)*2500);u.nextInternalAt=null}
function markDv(u,span){markExternal(u,span);u.dvUntil=performance.now()+Math.max(250,Math.max(.02,Number(span)||.5)*2500)}
function dvActive(u){return performance.now()<u.dvUntil}
function emitDv(u,time,outPeriod,parent,index){hit(u,time);MS.DvBus?.send(u.id,{kind:"dv",time,period:outPeriod,bpm:60/outPeriod,speed:speed(u),parent:parent||null,substep:index})}
function consumeExternalPulse(u,p={},mode="cv"){
 const sourcePeriod=Math.max(.02,Number(p.period)||u.lastSourcePeriod||60/(Number(p.bpm)||bpm(u))),time=Number(p.time)||u.ctx.currentTime,ratio=speed(u);
 u.lastSourcePeriod=sourcePeriod;if(mode==="dv")markDv(u,sourcePeriod);else markExternal(u,sourcePeriod);
 if(ratio<1){const stride=Math.max(2,Math.round(1/ratio));u.divCount=(u.divCount||0)+1;if(u.divCount===stride){u.divCount=0;emitDv(u,time,sourcePeriod*stride,p.source||null,0)}return}
 u.divCount=0;if(ratio===1){emitDv(u,time,sourcePeriod,p.source||null,0);return}
 emitDv(u,time,sourcePeriod/ratio,p.source||null,0);u.multStart=time;u.multPeriod=sourcePeriod;u.multRatio=Math.max(1,Math.round(ratio));u.multParent=p.source||null;u.multNext=1;scheduleMult(u)
}
function scheduleMult(u){if(!u.multStart||!u.multPeriod||u.multRatio<=1)return;const now=u.ctx.currentTime,horizon=now+LOOKAHEAD,step=u.multPeriod/u.multRatio;while(u.multNext<u.multRatio){const t=u.multStart+u.multNext*step;if(t>horizon)return;if(t>now-.001)emitDv(u,t,step,u.multParent,u.multNext);u.multNext++}if(u.multNext>=u.multRatio){u.multStart=null;u.multPeriod=null;u.multParent=null;u.multNext=0}}
function internalClock(u){if(performance.now()<u.externalUntil)return;const now=u.ctx.currentTime,interval=(60/bpm(u))/speed(u);if(u.nextInternalAt==null||u.nextInternalAt<now-.05)u.nextInternalAt=now+.01;while(u.nextInternalAt<=now+LOOKAHEAD){emitDv(u,u.nextInternalAt,interval,u.id,0);u.nextInternalAt+=interval}}
function schedulerTick(u){scheduleMult(u);internalClock(u)}
function resetTiming(u){u.divCount=0;u.nextInternalAt=null;u.multStart=null;u.multPeriod=null;u.multRatio=1;u.multParent=null;u.multNext=0}
function create(api){const c=api.context,input=c.createGain(),voice=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);voice.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);const u={id:api.instanceId,ctx:c,input,voice,mix,output,state:api.state,sampleBuffer:null,internalBuffer:null,onDv:null,onDiv:null,externalUntil:0,dvUntil:0,nextInternalAt:null,timer:null,lastSourcePeriod:null,divCount:0,multStart:null,multPeriod:null,multRatio:1,multParent:null,multNext:0};buildInternalSample(u);u.onDv=p=>{consumeExternalPulse(u,p,"dv");return null};u.onDiv=u.onDv;u.timer=setInterval(()=>schedulerTick(u),10);if(api.state.pcmKey)load(u,api.state.pcmKey);return u}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;const old=speed(u);u.state=state;if("bpm" in patch)u.nextInternalAt=null;if("division" in patch&&speed(u)!==old)resetTiming(u);if("pitch" in patch||"decay" in patch||"tone" in patch)buildInternalSample(u);if("pcmKey" in patch)load(u,state.pcmKey)}
function clockStart({runtime}){const u=runtime.user;if(!u)return;u.externalUntil=0;u.dvUntil=0;resetTiming(u)}
function clockStop({runtime}){const u=runtime.user;if(!u)return;u.dvUntil=0;resetTiming(u)}
function clockTick({runtime},tick){const u=runtime.user;if(!u)return false;if(dvActive(u))return true;consumeExternalPulse(u,{kind:"clock",time:tick?.time,bpm:tick?.bpm,period:tick?.period||60/Math.max(30,Math.min(300,Number(tick?.bpm)||120)),source:tick?.source},"cv");return true}
function cv({runtime},packet){const u=runtime.user;if(packet?.kind==="trigger"&&u&&!dvActive(u)){consumeExternalPulse(u,packet,"cv");return null}return packet}
function destroy({runtime}){const u=runtime.user;if(!u)return;if(u.timer)clearInterval(u.timer);for(const n of [u.input,u.voice,u.mix,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.TIME_BANDITS,version:"11",description:"PREBUILT PCM CLOCK · LITERAL CV/DV PULSE ACCUMULATION FOR DIVISION · DV PRIORITY · DIRECT INTERNAL INTERVAL · TIMESTAMPED MULTIPLICATION",defaults:defaults(),resources:["storage"],create,setState,clockStart,clockStop,clockTick,cv,destroy,moduleBuilder:model});
})(window);
