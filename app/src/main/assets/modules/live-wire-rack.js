"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract;
if(!C)return;
C.define({
 type:"live-wire",displayName:"Live Wire",category:"source",version:"2",color:"#ffd21f",selectorClass:"live-wire",
 description:"YOUTUBE CARRIER · LIVE · VALVE · HOLD TO SAMPLE",editorUrl:"live-wire.html",defaults:{live:false,valve:false},
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const rackGain=ctx.createGain(),out=ctx.createGain(),valveGain=ctx.createGain();
  rackGain.gain.value=api.state.live?1:0;valveGain.gain.value=api.state.valve?1:0;
  rackGain.connect(out);valveGain.connect(ctx.destination);api.setOutput(out);
  let next=ctx.currentTime;
  function chunk(pcm,rate){
   if(!pcm?.length)return;
   const b=ctx.createBuffer(1,pcm.length,rate||ctx.sampleRate);b.getChannelData(0).set(pcm);
   const s=ctx.createBufferSource();s.buffer=b;s.connect(rackGain);s.connect(valveGain);
   const t=Math.max(ctx.currentTime+.012,next);s.start(t);next=t+b.duration;
   s.onended=()=>{try{s.disconnect()}catch(_){}};
  }
  const off=MS.LiveWireNative?.onChunk(chunk)||null;
  return{out,rackGain,valveGain,off};
 },
 setState({runtime,state}){const u=runtime.user;if(!u)return;const t=runtime.context?.currentTime||0;try{u.rackGain.gain.setTargetAtTime(state.live?1:0,t,.008);u.valveGain.gain.setTargetAtTime(state.valve?1:0,t,.008)}catch(_){u.rackGain.gain.value=state.live?1:0;u.valveGain.gain.value=state.valve?1:0}},
 destroy({runtime}){const u=runtime.user;try{u?.off?.()}catch(_){}for(const n of [u?.rackGain,u?.valveGain,u?.out])try{n?.disconnect?.()}catch(_){}}
});
})(window);
