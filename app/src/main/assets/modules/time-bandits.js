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
function sendDv(u,time,period,parent,index=0){MS.DvBus?.send(u.id,{kind:"dv",time,period,bpm:60/period,speed:speed(u),parent:parent||null,substep:index})}
function fire(u,time,period,parent,index=0){hit(u,time);sendDv(u,time,period,parent,index)}
function clearDvTimers(u){for(const id of u.dvTimers)clearTimeout(id);u.dvTimers.length=0}
function sendDvAt(u,target,period,parent,index){const delay=Math.max(0,(target-u.ctx.currentTime)*1000);if(delay<=1){sendDv(u,target,period,parent,index);return}const id=setTimeout(()=>{u.dvTimers=u.dvTimers.filter(x=>x!==id);sendDv(u,target,period,parent,index)},delay);u.dvTimers.push(id)}
function pulse(u,p={},source="clock"){
 const ratio=speed(u),time=Number(p.time)||u.ctx.currentTime,packetPeriod=Math.max(.001,Number(p.period)||60/(Number(p.bpm)||bpm(u))),measured=u.lastInputTime!=null&&time>u.lastInputTime?time-u.lastInputTime:0,period=measured>.001?measured:(u.lastPeriod||packetPeriod);
 u.lastInputTime=time;u.lastPeriod=period;
 if(source==="dv"){u.dvSeen=true}else if(u.dvSeen)return;
 if(ratio<1){const n=Math.round(1/ratio);u.count=(u.count+1)&31;if((u.count%n)===0)fire(u,time,period*n,p.source||null);return}
 u.count=0;
 if(ratio===1){fire(u,time,period,p.source||null);return}
 const n=Math.round(ratio),step=period/n;for(let i=0;i<n;i++){const target=time+i*step;hit(u,target);sendDvAt(u,target,step,p.source||null,i)}
}
function resetTiming(u){clearDvTimers(u);u.count=0;u.dvSeen=false;u.lastInputTime=null;u.lastPeriod=null}
function create(api){const c=api.context,input=c.createGain(),voice=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);voice.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);const u={id:api.instanceId,ctx:c,input,voice,mix,output,state:api.state,sampleBuffer:null,internalBuffer:null,onDv:null,onDiv:null,lastPeriod:null,lastInputTime:null,count:0,dvSeen:false,dvTimers:[]};buildInternalSample(u);u.onDv=p=>{pulse(u,p,"dv");return null};u.onDiv=u.onDv;if(api.state.pcmKey)load(u,api.state.pcmKey);return u}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;u.state=state;if("division" in patch)u.count=0;if("pitch" in patch||"decay" in patch||"tone" in patch)buildInternalSample(u);if("pcmKey" in patch)load(u,state.pcmKey)}
function clockStart({runtime}){const u=runtime.user;if(!u)return;resetTiming(u)}
function clockStop({runtime}){const u=runtime.user;if(!u)return;resetTiming(u)}
function clockTick({runtime},tick){const u=runtime.user;if(!u||u.dvSeen)return true;const isMaster=tick?.source===u.id;if(isMaster&&((Number(tick?.substep)||0)%4)!==0)return true;const period=isMaster?60/(Number(tick?.bpm)||bpm(u)):(Number(tick?.period)||60/(Number(tick?.bpm)||bpm(u)));pulse(u,{kind:"clock",time:tick?.time,bpm:tick?.bpm,period,source:tick?.source},"clock");return true}
function cv({runtime},packet){const u=runtime.user;if(packet?.kind!=="trigger"||!u)return packet;if(u.dvSeen)return packet;pulse(u,packet,"cv");return null}
function destroy({runtime}){const u=runtime.user;if(!u)return;clearDvTimers(u);for(const n of [u.input,u.voice,u.mix,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.TIME_BANDITS,version:"17",description:"TOP-TIMER CLOCK SOURCE · UPSTREAM CLOCK FOLLOWER · AUDIO-CLOCK PCM · POWER-OF-TWO CV/DV · DV PRIORITY",defaults:defaults(),resources:["storage"],create,setState,clockStart,clockStop,clockTick,cv,destroy,moduleBuilder:model});
})(window);
