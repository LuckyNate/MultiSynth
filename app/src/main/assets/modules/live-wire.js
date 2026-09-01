"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions,N=MS.LiveWireNative;
if(!C||!I)return;
const defaults={live:false,random:false};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-4",description:"YOUTUBE CARRIER · LIVE · HOLD TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const liveGain=ctx.createGain(),out=ctx.createGain(),sources=new Set();
  liveGain.gain.value=0;liveGain.connect(out);api.setOutput(out);
  let next=ctx.currentTime;
  function active(){return !!api.state.live&&!!api.node?.hasDownstream}
  function stopScheduled(){for(const s of sources){try{s.stop()}catch(_){}try{s.disconnect()}catch(_){}}sources.clear();next=ctx.currentTime}
  function sync(){const on=active(),t=ctx.currentTime;try{liveGain.gain.setTargetAtTime(on?1:0,t,.006)}catch(_){liveGain.gain.value=on?1:0}try{N?.setMuted?.(!on)}catch(_){}if(!on)stopScheduled()}
  function chunk(pcm,rate){if(!active()||!pcm?.length)return;const b=ctx.createBuffer(1,pcm.length,rate||ctx.sampleRate);b.getChannelData(0).set(pcm);const s=ctx.createBufferSource();s.buffer=b;s.connect(liveGain);sources.add(s);const t=Math.max(ctx.currentTime+.012,next);s.start(t);next=t+b.duration;s.onended=()=>{sources.delete(s);try{s.disconnect()}catch(_){}}}
  const off=N?.onChunk?.(chunk)||null;sync();return{out,liveGain,off,sources,stopScheduled,sync};
 },
 setState({runtime}){runtime.user?.sync?.()},
 destroy({runtime}){const u=runtime.user;try{u?.stopScheduled?.()}catch(_){}try{u?.off?.()}catch(_){}try{N?.stopPlayer?.()}catch(_){}try{N?.stop?.()}catch(_){}try{N?.setMuted?.(true)}catch(_){}for(const n of [u?.liveGain,u?.out])try{n?.disconnect?.()}catch(_){}},
 serialize:({state})=>({...defaults,...state}),restore:({saved})=>{const s={...defaults,...(saved||{})};delete s.valve;return s}
});
B?.define?.({id:I.LIVE_WIRE,model:"module-builder",version:4,package:{id:I.LIVE_WIRE,version:4,behavior:{audioMode:"native-video-carrier-source",capture:"hold-to-pcm",stateOwnership:"module-builder",audibleOnlyWhenConnected:true,destroyStopsTransport:true}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"touchscreen",label:"VIDEO RECEIVER",node:"controller.source"},{id:"seek",control:"dial",label:"PRECISION SEEK",meta:{unit:"s",gesture:"circular-drag",range:"wide"},node:"controller.seek"},{id:"random",control:"switch",state:"random",label:"RANDOM",node:"controller.random"},{id:"live",control:"switch",state:"live",label:"LIVE",node:"controller.live"},{id:"pause",control:"button",label:"PAUSE",node:"controller.pause"},{id:"stop",control:"button",label:"STOP",node:"controller.stop"},{id:"next",control:"button",label:"NEXT",node:"controller.next"},{id:"record",control:"hold",label:"HOLD TO RECORD",node:"controller.record"}],sources:[{id:"source.native",type:"nativeAudio",mode:"capture"}],actions:[{id:"action.select",type:"selectVideo"},{id:"action.seek",type:"seek"},{id:"action.pause",type:"pause"},{id:"action.stop",type:"stop"},{id:"action.next",type:"nextSource"},{id:"action.record",type:"savePcm"},{id:"action.live",type:"setState",state:"live"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.pause","action.pause"],["controller.stop","action.stop"],["controller.next","action.next"],["controller.record","action.record"],["controller.live","action.live"],["source.native","action.record"]]}});
})(window);
