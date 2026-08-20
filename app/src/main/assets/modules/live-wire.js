"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;
if(!C||!I)return;
const defaults={live:false,valve:false,random:false};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-1",description:"YOUTUBE CARRIER · LIVE · VALVE · HOLD TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const rackGain=ctx.createGain(),out=ctx.createGain();rackGain.gain.value=api.state.live?1:0;rackGain.connect(out);api.setOutput(out);
  let next=ctx.currentTime;
  function chunk(pcm,rate){if(!pcm?.length)return;const b=ctx.createBuffer(1,pcm.length,rate||ctx.sampleRate);b.getChannelData(0).set(pcm);const s=ctx.createBufferSource();s.buffer=b;s.connect(rackGain);const t=Math.max(ctx.currentTime+.012,next);s.start(t);next=t+b.duration;s.onended=()=>{try{s.disconnect()}catch(_){}}}
  const off=MS.LiveWireNative?.onChunk(chunk)||null;MS.LiveWireNative?.setValve?.(!!api.state.valve);return{out,rackGain,off};
 },
 setState({runtime,state}){const u=runtime.user;if(!u)return;const t=runtime.context?.currentTime||0;try{u.rackGain.gain.setTargetAtTime(state.live?1:0,t,.008)}catch(_){u.rackGain.gain.value=state.live?1:0}MS.LiveWireNative?.setValve?.(!!state.valve)},
 destroy({runtime}){const u=runtime.user;try{u?.off?.()}catch(_){}for(const n of [u?.rackGain,u?.out])try{n?.disconnect?.()}catch(_){}},
 serialize:({state})=>({...defaults,...state}),restore:({saved})=>({...defaults,...(saved||{})})
});
B?.define?.({id:I.LIVE_WIRE,model:"module-builder",version:1,package:{id:I.LIVE_WIRE,version:1,behavior:{audioMode:"native-video-carrier-source",capture:"hold-to-pcm",stateOwnership:"module-builder"}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"touchscreen",label:"VIDEO RECEIVER",node:"controller.source"},{id:"seek",control:"dial",label:"PRECISION SEEK",meta:{unit:"s",gesture:"circular-drag"},node:"controller.seek"},{id:"random",control:"switch",state:"random",label:"RANDOM",node:"controller.random"},{id:"live",control:"switch",state:"live",label:"LIVE",node:"controller.live"},{id:"valve",control:"switch",state:"valve",label:"VALVE",node:"controller.valve"},{id:"next",control:"button",label:"NEXT",node:"controller.next"},{id:"record",control:"hold",label:"HOLD TO RECORD",node:"controller.record"}],sources:[{id:"source.native",type:"nativeAudio",mode:"capture"}],actions:[{id:"action.select",type:"selectVideo"},{id:"action.seek",type:"seek"},{id:"action.next",type:"nextSource"},{id:"action.record",type:"savePcm"},{id:"action.live",type:"setState",state:"live"},{id:"action.valve",type:"setState",state:"valve"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.next","action.next"],["controller.record","action.record"],["controller.live","action.live"],["controller.valve","action.valve"],["source.native","action.record"]]}});
})(window);
