"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.ModuleStandard,B=MS.ModuleBuilderDefinitions,N=MS.LiveWireNative;
if(!C||!I||!S)return;
const defaults={};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-15",description:"FREESOUND AUDIO PLAYER · CV/MANUAL SAMPLE TRIGGER · 30 RPM PRECISION SEEK · HOLD OR COPY TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const out=ctx.createGain();out.gain.value=1;api.setOutput(out);
  const player=S.sampler(ctx,out,{maxLag:.05}),sample={start:0,end:0,pitch:0,level:1,leftLevel:1,rightLevel:1,lagMs:0};
  let duration=0,transportOffset=0,transportStartedAt=0,transportPlaying=false,transportToken=0,transportTimer=null,transportTicker=null;
  const currentOffset=()=>transportPlaying?Math.max(0,Math.min(duration,transportOffset+(ctx.currentTime-transportStartedAt))):Math.max(0,Math.min(duration,transportOffset));
  const emitTransport=(extra={})=>global.dispatchEvent(new CustomEvent("multisynth-live-wire-transport-state",{detail:{instanceId:api.instanceId,offset:currentOffset(),playing:transportPlaying,duration,...extra}}));
  const clearTimer=()=>{if(transportTimer)clearTimeout(transportTimer);transportTimer=null;if(transportTicker)clearInterval(transportTicker);transportTicker=null};
  const markTransport=(offset,t)=>{clearTimer();transportOffset=Math.max(0,Math.min(duration,Number(offset)||0));transportStartedAt=Number(t)||ctx.currentTime;transportPlaying=true;const token=++transportToken,ms=Math.max(0,((transportStartedAt-ctx.currentTime)+(duration-transportOffset))*1000);transportTicker=setInterval(()=>{if(token!==transportToken||!transportPlaying)return;emitTransport()},33);transportTimer=setTimeout(()=>{if(token!==transportToken)return;transportPlaying=false;transportOffset=0;transportStartedAt=0;clearTimer();emitTransport({ended:true})},ms+12);emitTransport()};
  const play=(t=ctx.currentTime,offset=0,stopExisting=false)=>{const b=player.buffers.get(0);if(!b)return false;if(stopExisting)player.stopAll();const start=Math.max(0,Math.min(b.duration-.0001,Number(offset)||0)),state={...sample,start,end:b.duration},ok=player.play(0,state,Number(t)||ctx.currentTime);if(ok){markTransport(start,Number(t)||ctx.currentTime);global.dispatchEvent(new CustomEvent("multisynth-live-wire-trigger-visual",{detail:{instanceId:api.instanceId}}))}return ok};
  const pause=()=>{transportOffset=currentOffset();transportPlaying=false;transportStartedAt=0;transportToken++;clearTimer();player.stopAll();emitTransport()};
  const stop=(reset=true)=>{const held=currentOffset();transportPlaying=false;transportStartedAt=0;transportOffset=reset?0:held;transportToken++;clearTimer();player.stopAll();emitTransport()};
  const seek=(offset,resume)=>{const next=Math.max(0,Math.min(duration,Number(offset)||0));player.stopAll();transportToken++;clearTimer();transportOffset=next;transportPlaying=false;transportStartedAt=0;if(resume)return play(ctx.currentTime,next,false);emitTransport();return true};
  const onResident=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId)||!d.pcm?.length||!d.sampleRate)return;player.stopAll();transportToken++;clearTimer();const b=player.install(0,d.pcm,d.sampleRate);if(b){duration=b.duration;sample.start=0;sample.end=b.duration;transportOffset=0;transportPlaying=false;transportStartedAt=0;emitTransport()}};
  const onManual=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;play(ctx.currentTime,0,false)};
  const onTransport=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;const action=String(d.action||"");if(action==="pause")pause();else if(action==="play")play(ctx.currentTime,d.offset,true);else if(action==="seek")seek(d.offset,!!d.playing);else if(action==="stop")stop(true)};
  global.addEventListener("multisynth-live-wire-resident",onResident);
  global.addEventListener("multisynth-live-wire-manual-trigger",onManual);
  global.addEventListener("multisynth-live-wire-transport",onTransport);
  return{out,player,sample,play,onResident,onManual,onTransport,clearTimer};
 },
 setState(){},
 trigger({runtime},packet={}){
  const u=runtime.user;if(!u?.play)return false;
  return u.play(Number(packet.time)||runtime.context.currentTime,0,false);
 },
 destroy({runtime}){const u=runtime.user;try{N?.stop?.()}catch(_){}if(u){global.removeEventListener("multisynth-live-wire-resident",u.onResident);global.removeEventListener("multisynth-live-wire-manual-trigger",u.onManual);global.removeEventListener("multisynth-live-wire-transport",u.onTransport);try{u.clearTimer?.()}catch(_){}try{u.player?.stopAll?.()}catch(_){}try{u.player?.buffers?.clear?.()}catch(_){}try{u.out?.disconnect?.()}catch(_){}}},
 serialize:({state})=>({...state}),restore:({saved})=>({...saved})
});
B?.define?.({id:I.LIVE_WIRE,model:"module-builder",version:15,package:{id:I.LIVE_WIRE,version:15,behavior:{audioMode:"shared-resident-pcm-sampler",capture:"hold-to-pcm",copy:"whole-source-to-pcm-library",repeatUntilGo:true,trigger:"manual-pad-or-cv-shared-sampler-timestamped",transport:"shared-sampler-seek-pause-resume-live-position",stateOwnership:"module-builder",destroyStopsTransport:true}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"touchscreen",label:"AUDIO SOURCE",node:"controller.source"},{id:"seek",control:"turntable",label:"PRECISION SEEK · 30 RPM",meta:{unit:"s",gesture:"circular-drag",scale:"1 revolution = 2 seconds"},node:"controller.seek"},{id:"trigger",control:"pad",label:"TRIGGER",node:"controller.trigger"},{id:"pause",control:"button",label:"PAUSE",node:"controller.pause"},{id:"copy",control:"button",label:"COPY TO SAMPLE",node:"controller.copy"},{id:"record",control:"hold",label:"HOLD TO RECORD",node:"controller.record"}],sources:[{id:"source.freesound",type:"networkAudio",mode:"preview"}],actions:[{id:"action.select",type:"selectAudio"},{id:"action.seek",type:"seek"},{id:"action.trigger",type:"trigger"},{id:"action.pause",type:"pause"},{id:"action.copy",type:"copyPcm"},{id:"action.record",type:"savePcm"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.trigger","action.trigger"],["controller.pause","action.pause"],["controller.copy","action.copy"],["controller.record","action.record"],["source.freesound","action.trigger"],["source.freesound","action.copy"],["source.freesound","action.record"]]}});
})(window);
