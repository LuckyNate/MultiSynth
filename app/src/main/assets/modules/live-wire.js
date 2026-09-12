"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.ModuleStandard,N=MS.LiveWireNative,T=MS.TurntableControl;
if(!C||!I||!S||!T)return;
const defaults={clip:true,loop:false};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-18",description:"FREESOUND AUDIO PLAYER · CV/MANUAL SAMPLE TRIGGER · 33⅓ RPM TURNTABLE · HOLD OR COPY TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const out=ctx.createGain();out.gain.value=1;api.setOutput(out);
  const player=S.sampler(ctx,out,{maxLag:.05}),sample={start:0,end:0,pitch:0,level:1,leftLevel:1,rightLevel:1,lagMs:0};
  let duration=0,transportOffset=0,transportPlaying=false,transportTicker=null,clip=api.state?.clip!==false,loop=!!api.state?.loop;
  const engine=T.createPlatterEngine(ctx,out,{bufferSize:256,loop,onEnd:({position})=>{transportOffset=Math.max(0,Math.min(duration,Number(position)||duration));transportPlaying=false;clearTicker();emitTransport({ended:true})}});
  const currentOffset=()=>engine?.active?Math.max(0,Math.min(duration,engine.position)):Math.max(0,Math.min(duration,transportOffset));
  const emitTransport=(extra={})=>global.dispatchEvent(new CustomEvent("multisynth-live-wire-transport-state",{detail:{instanceId:api.instanceId,offset:currentOffset(),playing:transportPlaying,duration,clip,loop,rate:engine?.rate??0,...extra}}));
  const clearTicker=()=>{if(transportTicker)clearInterval(transportTicker);transportTicker=null};
  const startTicker=()=>{clearTicker();transportTicker=setInterval(()=>{if(!transportPlaying)return;transportOffset=currentOffset();emitTransport()},33)};
  const play=(t=ctx.currentTime,offset=0,stopExisting=clip)=>{const b=player.buffers.get(0);if(!b||!engine)return false;if(stopExisting)player.stopAll();const start=Math.max(0,Math.min(b.duration-.0001,Number(offset)||0));engine.setLoop(loop);if(!engine.start(start,1))return false;transportOffset=start;transportPlaying=true;startTicker();emitTransport();global.dispatchEvent(new CustomEvent("multisynth-live-wire-trigger-visual",{detail:{instanceId:api.instanceId}}));return true};
  const pause=()=>{transportOffset=currentOffset();transportPlaying=false;clearTicker();engine?.stop?.(transportOffset);emitTransport()};
  const stop=(reset=true)=>{const held=currentOffset();transportPlaying=false;clearTicker();transportOffset=reset?0:held;engine?.stop?.(transportOffset);emitTransport()};
  const seek=(offset,resume)=>{const next=Math.max(0,Math.min(duration,Number(offset)||0));transportOffset=next;engine?.seek?.(next);if(resume)return play(ctx.currentTime,next,false);transportPlaying=false;clearTicker();engine?.stop?.(next);emitTransport();return true};
  const platterMotion=(offset,rate)=>{const next=Math.max(0,Math.min(duration,Number(offset)||0));transportOffset=next;if(transportPlaying)engine?.setMotion?.(next,Number(rate)||0);emitTransport({platter:true});return true};
  const onResident=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId)||!d.pcm?.length||!d.sampleRate)return;player.stopAll();transportPlaying=false;clearTicker();const b=player.install(0,d.pcm,d.sampleRate);if(b){engine?.setBuffer?.(b);engine?.setLoop?.(loop);duration=b.duration;sample.start=0;sample.end=b.duration;transportOffset=0;engine?.seek?.(0);emitTransport()}};
  const onManual=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;play(ctx.currentTime,0,clip)};
  const onClip=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;clip=d.clip!==false;api.state.clip=clip;emitTransport({clipChanged:true})};
  const onLoop=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;loop=!!d.loop;api.state.loop=loop;engine?.setLoop?.(loop);emitTransport({loopChanged:true})};
  const onTransport=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;const action=String(d.action||"");if(action==="pause")pause();else if(action==="play")play(ctx.currentTime,d.offset,false);else if(action==="seek")seek(d.offset,!!d.playing);else if(action==="platter-motion"||action==="scratch")platterMotion(d.offset,d.rate);else if(action==="scratch-start")platterMotion(d.offset,0);else if(action==="scratch-end")platterMotion(d.offset,d.rate??1);else if(action==="stop")stop(d.preserve!==true)};
  global.addEventListener("multisynth-live-wire-resident",onResident);
  global.addEventListener("multisynth-live-wire-manual-trigger",onManual);
  global.addEventListener("multisynth-live-wire-clip",onClip);
  global.addEventListener("multisynth-live-wire-loop",onLoop);
  global.addEventListener("multisynth-live-wire-transport",onTransport);
  return{out,player,sample,play,onResident,onManual,onClip,onLoop,onTransport,clearTicker,engine,setClip:v=>{clip=v!==false},setLoop:v=>{loop=!!v;engine?.setLoop?.(loop)}};
 },
 setState({runtime,state}){runtime.user?.setClip?.(state.clip!==false);runtime.user?.setLoop?.(!!state.loop)},
 trigger({runtime},packet={}){const u=runtime.user;if(!u?.play)return false;return u.play(Number(packet.time)||runtime.context.currentTime,0,runtime.state?.clip!==false)},
 destroy({runtime}){const u=runtime.user;try{N?.stop?.()}catch(_){}if(u){global.removeEventListener("multisynth-live-wire-resident",u.onResident);global.removeEventListener("multisynth-live-wire-manual-trigger",u.onManual);global.removeEventListener("multisynth-live-wire-clip",u.onClip);global.removeEventListener("multisynth-live-wire-loop",u.onLoop);global.removeEventListener("multisynth-live-wire-transport",u.onTransport);try{u.clearTicker?.()}catch(_){}try{u.engine?.disconnect?.()}catch(_){}try{u.player?.stopAll?.()}catch(_){}try{u.player?.buffers?.clear?.()}catch(_){}try{u.out?.disconnect?.()}catch(_){}}},
 serialize:({state})=>({...state}),restore:({saved})=>({...defaults,...saved})
});
C.defineSurface(I.LIVE_WIRE,{version:18,package:{id:I.LIVE_WIRE,version:18,behavior:{audioMode:"shared-resident-pcm-platter",capture:"hold-to-pcm",copy:"whole-source-to-pcm-library",repeatUntilGo:true,trigger:"manual-pad-or-cv-shared-sampler-timestamped",clip:"default-on-retrigger-choke-off-overlap",loop:"off-one-shot-on-continuous-wrap",transport:"33.333rpm-platter-is-playback-speed",stateOwnership:"module",destroyStopsTransport:true}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"screen",label:"AUDIO SOURCE",node:"controller.source"},{id:"seek",control:"turntable",label:"PRECISION SEEK · 33⅓ RPM",meta:{unit:"s",gesture:"physical-platter",scale:"33⅓ RPM = 1×"},node:"controller.seek"},{id:"trigger",control:"pad",label:"TRIGGER",node:"controller.trigger"},{id:"clip",control:"switch",label:"CLIP",node:"controller.clip"},{id:"loop",control:"switch",label:"LOOP",node:"controller.loop"},{id:"copy",control:"button",label:"COPY TO SAMPLE",node:"controller.copy"},{id:"record",control:"pad",label:"HOLD TO RECORD",meta:{gesture:"hold"},node:"controller.record"}],sources:[{id:"source.freesound",type:"networkAudio",mode:"preview"}],actions:[{id:"action.select",type:"selectAudio"},{id:"action.seek",type:"seek"},{id:"action.trigger",type:"trigger"},{id:"action.clip",type:"toggle"},{id:"action.loop",type:"toggle"},{id:"action.copy",type:"copyPcm"},{id:"action.record",type:"savePcm"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.trigger","action.trigger"],["controller.clip","action.clip"],["controller.loop","action.loop"],["controller.copy","action.copy"],["controller.record","action.record"],["source.freesound","action.trigger"],["source.freesound","action.copy"],["source.freesound","action.record"]]}});
})(window);
