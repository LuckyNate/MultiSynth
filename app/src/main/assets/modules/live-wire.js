"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;
if(!C||!I)return;
C.define({
 type:I.LIVE_WIRE,version:"3",description:"YOUTUBE CARRIER · LIVE · VALVE · HOLD TO SAMPLE",defaults:{live:false,valve:false},
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const rackGain=ctx.createGain(),out=ctx.createGain();rackGain.gain.value=api.state.live?1:0;rackGain.connect(out);api.setOutput(out);
  let next=ctx.currentTime;
  function chunk(pcm,rate){if(!pcm?.length)return;const b=ctx.createBuffer(1,pcm.length,rate||ctx.sampleRate);b.getChannelData(0).set(pcm);const s=ctx.createBufferSource();s.buffer=b;s.connect(rackGain);const t=Math.max(ctx.currentTime+.012,next);s.start(t);next=t+b.duration;s.onended=()=>{try{s.disconnect()}catch(_){}}}
  const off=MS.LiveWireNative?.onChunk(chunk)||null;MS.LiveWireNative?.setValve?.(!!api.state.valve);return{out,rackGain,off};
 },
 setState({runtime,state}){const u=runtime.user;if(!u)return;const t=runtime.context?.currentTime||0;try{u.rackGain.gain.setTargetAtTime(state.live?1:0,t,.008)}catch(_){u.rackGain.gain.value=state.live?1:0}MS.LiveWireNative?.setValve?.(!!state.valve)},
 destroy({runtime}){const u=runtime.user;try{u?.off?.()}catch(_){}for(const n of [u?.rackGain,u?.out])try{n?.disconnect?.()}catch(_){}}
});
})(window);
