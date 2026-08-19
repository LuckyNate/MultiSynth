"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.RackStandard,Defs=MS.ModuleBuilderDefinitions;if(!C||!I||!S||!Defs)return;
const model=Defs.require(I.TIME_BANDITS),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),LOOKAHEAD=.045;
const defaults=()=>({...model.defaults});
const DIVISORS=new Map([[0.5,2],[0.25,4],[0.125,8],[0.0625,16],[0.03125,32]]);
const MULTIPLIERS=new Map([[1,1],[2,2],[4,4],[8,8],[16,16],[32,32]]);
function buildInternalSample(u){const c=u.ctx,sr=c.sampleRate,pitch=clamp(u.state.pitch,30,800),decay=clamp(u.state.decay,25,1500)/1000,tone=clamp(u.state.tone,0,100),duration=Math.max(.03,decay+.012),frames=Math.max(2,Math.ceil(duration*sr)),b=c.createBuffer(1,frames,sr),out=b.getChannelData(0);let phase=0,lp=0;const cutoff=clamp(300+tone*90,120,12000),a=1-Math.exp(-2*Math.PI*cutoff/sr),sweep=Math.min(decay,.18);for(let i=0;i<frames;i++){const t=i/sr,env=t<.002?t/.002:Math.exp(-Math.max(0,t-.002)*Math.log(10000)/Math.max(.001,decay)),k=Math.min(1,t/Math.max(.001,sweep)),freq=pitch*Math.pow(Math.max(25,pitch*.45)/pitch,k);phase=(phase+freq/sr)%1;const tri=1-4*Math.abs(phase-.5);lp+=a*(tri-lp);out[i]=clamp(lp*env,-1,1)}u.internalBuffer=b}
function playBuffer(u,t,buffer,level=1){if(!buffer)return;const c=u.ctx,s=c.createBufferSource(),g=c.createGain(),when=Math.max(c.currentTime+.001,Number(t)||c.currentTime+.001);s.buffer=buffer;g.gain.value=clamp(level,0,1);s.connect(g).connect(u.voice);s.onended=()=>{try{s.disconnect();g.disconnect()}catch(_){}};s.start(when)}
function hit(u,t){if(Math.random()*100>clamp(u.state.probability,0,100))return;playBuffer(u,t,u.sampleBuffer||u.internalBuffer,clamp(u.state.level,0,100)/100)}
async function load(u,key){u.sampleBuffer=null;if(!key)return;const L=MS.PCMLibrary;try{const r=await L?.get?.(key);if(!r?.data?.length)return;const b=u.ctx.createBuffer(1,r.data.length,r.sampleRate);b.getChannelData(0).set(r.data);u.sampleBuffer=b}catch(e){console.error(I.displayNameFor(I.TIME_BANDITS)+" sample",e)}}
function bpm(u){return clamp(u.state.bpm??model.defaults.bpm,30,300)}
function speed(u){const n=Number(u.state.division);return DIVISORS.has(n)||MULTIPLIERS.has(n)?n:1}
function markExternal(u,span){u.externalUntil=performance.now()+Math.max(250,Math.max(.02,Number(span)||.5)*2500);u.nextInternalAt=null}
function markDv(u,span){markExternal(u,span);u.dvUntil=performance.now()+Math.max(250,Math.max(.02,Number(span)||.5)*2500)}
function dvActive(u){return performance.now()<u.dvUntil}
function emitDv(u,time,outPeriod,parent,index=0){hit(u,time);MS.DvBus?.send(u.id,{kind:"dv",time,period:outPeriod,bpm:60/outPeriod,speed:speed(u),parent:parent||null,substep:index})}
function openWindow(u,p={},mode="external"){
 const sourcePeriod=Math.max(.02,Number(p.period)||u.windowPeriod||60/(Number(p.bpm)||bpm(u))),start=Number(p.time)||u.ctx.currentTime+.003,current=speed(u);
 if(mode==="dv")markDv(u,sourcePeriod);else if(mode==="external")markExternal(u,sourcePeriod);
 const divisor=DIVISORS.get(current)||0;
 if(divisor){u.sourceCount++;if(u.sourceCount<divisor)return;u.sourceCount=0;emitDv(u,start,sourcePeriod*divisor,p.source||null,0);return}
 u.sourceCount=0;u.windowStart=start;u.windowPeriod=sourcePeriod;u.windowEnd=start+sourcePeriod;u.windowParent=p.source||null;u.scheduledThrough=start-.0005;u.lastBoundary=-Infinity;scheduleWindow(u)
}
function scheduleWindow(u){if(u.windowStart==null||u.windowPeriod==null)return;const now=u.ctx.currentTime,horizon=now+LOOKAHEAD;if(now>u.windowEnd+.01)return;const count=MULTIPLIERS.get(speed(u))||1,outPeriod=u.windowPeriod/count,from=Math.max(u.windowStart,u.scheduledThrough+.0005,now+.001),k0=Math.max(0,Math.ceil((from-u.windowStart-.000001)/outPeriod));for(let k=k0;k<count;k++){const t=u.windowStart+k*outPeriod;if(t>horizon||t>=u.windowEnd-.000001)break;if(t<=u.lastBoundary+.0005)continue;emitDv(u,t,outPeriod,u.windowParent,k);u.lastBoundary=t;u.scheduledThrough=t}}
function retimeCurrentWindow(u){if(u.windowStart==null||u.ctx.currentTime>=u.windowEnd)return;u.scheduledThrough=u.ctx.currentTime;u.lastBoundary=Math.min(u.lastBoundary,u.ctx.currentTime);scheduleWindow(u)}
function retimeBpm(u,oldBpm){if(!u.masterInternal)return;const now=u.ctx.currentTime,oldSpan=60/clamp(oldBpm,30,300),newSpan=60/bpm(u);if(u.lastInternalAt==null||u.nextInternalAt==null){u.nextInternalAt=now+.003;return}const phase=clamp((now-u.lastInternalAt)/oldSpan,0,.999999);u.nextInternalAt=now+newSpan*(1-phase)}
function internalClock(u){if(!u.masterInternal||performance.now()<u.externalUntil)return;const now=u.ctx.currentTime,span=60/bpm(u);if(u.nextInternalAt==null||u.nextInternalAt<now-.05)u.nextInternalAt=now+.003;while(u.nextInternalAt<=now+LOOKAHEAD){const t=u.nextInternalAt;openWindow(u,{kind:"internal-clock",source:u.id,time:t,period:span,bpm:bpm(u)},"internal");u.lastInternalAt=t;u.nextInternalAt+=span}}
function schedulerTick(u){scheduleWindow(u);internalClock(u)}
function resetTiming(u){u.windowStart=null;u.windowEnd=null;u.windowPeriod=null;u.windowParent=null;u.scheduledThrough=-Infinity;u.lastBoundary=-Infinity;u.sourceCount=0;u.lastInternalAt=null;u.nextInternalAt=null;u.dvUntil=0;u.externalUntil=0}
function create(api){const c=api.context,input=c.createGain(),voice=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);voice.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);const u={id:api.instanceId,ctx:c,input,voice,mix,output,state:api.state,sampleBuffer:null,internalBuffer:null,onDv:null,onDiv:null,masterInternal:true,externalUntil:0,dvUntil:0,nextInternalAt:c.currentTime+.04,lastInternalAt:null,timer:null,windowStart:null,windowEnd:null,windowPeriod:null,windowParent:null,scheduledThrough:-Infinity,lastBoundary:-Infinity,sourceCount:0};buildInternalSample(u);u.onDv=p=>{u.masterInternal=false;openWindow(u,p,"dv");return null};u.onDiv=u.onDv;u.timer=setInterval(()=>schedulerTick(u),10);if(api.state.pcmKey)load(u,api.state.pcmKey);return u}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;const oldBpm=bpm(u),oldSpeed=speed(u);u.state=state;if("bpm" in patch&&bpm(u)!==oldBpm)retimeBpm(u,oldBpm);if("division" in patch&&speed(u)!==oldSpeed){u.sourceCount=0;retimeCurrentWindow(u)}if("pitch" in patch||"decay" in patch||"tone" in patch)buildInternalSample(u);if("pcmKey" in patch)load(u,state.pcmKey)}
function clockStart({runtime},info={}){const u=runtime.user;if(!u)return;resetTiming(u);u.masterInternal=!!(info.master||info.source===u.id);if(u.masterInternal)u.nextInternalAt=Number(info.startTime)||u.ctx.currentTime+.04;else u.externalUntil=Infinity}
function clockStop({runtime}){const u=runtime.user;if(!u)return;resetTiming(u);u.masterInternal=false}
function clockTick({runtime},tick){const u=runtime.user;if(!u)return false;if(tick?.source===u.id)return true;u.masterInternal=false;if(dvActive(u))return true;openWindow(u,{kind:"clock",time:tick?.time,bpm:tick?.bpm,period:tick?.period||60/Math.max(30,Math.min(300,Number(tick?.bpm)||120)),source:tick?.source},"external");return true}
function cv({runtime},packet){const u=runtime.user;if(packet?.kind!=="trigger"||!u)return packet;if(dvActive(u))return packet;u.masterInternal=false;openWindow(u,packet,"external");return null}
function destroy({runtime}){const u=runtime.user;if(!u)return;if(u.timer)clearInterval(u.timer);for(const n of [u.input,u.voice,u.mix,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.TIME_BANDITS,version:"19",description:"PROVEN INTERNAL PCM CLOCK · EXPLICIT POWER-OF-TWO DIVIDE/MULTIPLY · TOP-TIMER INTERNAL SOURCE · UPSTREAM FOLLOWER · DV PRIORITY",defaults:defaults(),resources:["storage"],create,setState,clockStart,clockStop,clockTick,cv,destroy,moduleBuilder:model});
})(window);
