"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions,N=MS.LiveWireNative;
if(!C||!I)return;
const defaults={random:false};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-5",description:"YOUTUBE CARRIER · HOLD TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const carrier=ctx.createGain(),out=ctx.createGain(),sources=new Set();
  carrier.gain.value=0;carrier.connect(out);api.setOutput(out);
  let next=ctx.currentTime;
  function active(){return !!api.node?.hasDownstream}
  function stopScheduled(){for(const s of sources){try{s.stop()}catch(_){}try{s.disconnect()}catch(_){}}sources.clear();next=ctx.currentTime}
  function sync(){const on=active(),t=ctx.currentTime;try{carrier.gain.setTargetAtTime(on?1:0,t,.006)}catch(_){carrier.gain.value=on?1:0}try{N?.setMuted?.(!on)}catch(_){}if(!on)stopScheduled()}
  function chunk(pcm,rate){if(!active()||!pcm?.length)return;const b=ctx.createBuffer(1,pcm.length,rate||ctx.sampleRate);b.getChannelData(0).set(pcm);const s=ctx.createBufferSource();s.buffer=b;s.connect(carrier);sources.add(s);const t=Math.max(ctx.currentTime+.012,next);s.start(t);next=t+b.duration;s.onended=()=>{sources.delete(s);try{s.disconnect()}catch(_){}}}
  const off=N?.onChunk?.(chunk)||null;sync();return{out,carrier,off,sources,stopScheduled,sync};
 },
 setState({runtime}){runtime.user?.sync?.()},
 destroy({runtime}){const u=runtime.user;try{u?.stopScheduled?.()}catch(_){}try{u?.off?.()}catch(_){}try{N?.stopPlayer?.()}catch(_){}try{N?.stop?.()}catch(_){}try{N?.setMuted?.(true)}catch(_){}for(const n of [u?.carrier,u?.out])try{n?.disconnect?.()}catch(_){}},
 serialize:({state})=>({...defaults,...state}),restore:({saved})=>{const s={...defaults,...(saved||{})};delete s.live;delete s.valve;return s}
});
B?.define?.({id:I.LIVE_WIRE,model:"module-builder",version:5,package:{id:I.LIVE_WIRE,version:5,behavior:{audioMode:"native-video-carrier-source",capture:"hold-to-pcm",stateOwnership:"module-builder",audibleOnlyWhenConnected:true,destroyStopsTransport:true,carrierAlwaysAvailableWhenConnected:true}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"touchscreen",label:"VIDEO RECEIVER",node:"controller.source"},{id:"seek",control:"dial",label:"PRECISION SEEK",meta:{unit:"s",gesture:"circular-drag",range:"wide"},node:"controller.seek"},{id:"random",control:"switch",state:"random",label:"RANDOM",node:"controller.random"},{id:"pause",control:"button",label:"PAUSE",node:"controller.pause"},{id:"stop",control:"button",label:"STOP",node:"controller.stop"},{id:"next",control:"button",label:"NEXT",node:"controller.next"},{id:"record",control:"hold",label:"HOLD TO RECORD",node:"controller.record"}],sources:[{id:"source.native",type:"nativeAudio",mode:"capture"}],actions:[{id:"action.select",type:"selectVideo"},{id:"action.seek",type:"seek"},{id:"action.pause",type:"pause"},{id:"action.stop",type:"stop"},{id:"action.next",type:"nextSource"},{id:"action.record",type:"savePcm"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.pause","action.pause"],["controller.stop","action.stop"],["controller.next","action.next"],["controller.record","action.record"],["source.native","action.record"]]}});
})(window);
