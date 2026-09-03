"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.ModuleStandard,B=MS.ModuleBuilderDefinitions,N=MS.LiveWireNative;
if(!C||!I||!S)return;
const defaults={};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-13",description:"FREESOUND AUDIO PLAYER · CV/MANUAL SAMPLE TRIGGER · 30 RPM PRECISION SEEK · HOLD OR COPY TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const out=ctx.createGain();out.gain.value=1;api.setOutput(out);
  const player=S.sampler(ctx,out,{maxLag:.05}),sample={start:0,end:0,pitch:0,level:1,leftLevel:1,rightLevel:1,lagMs:0};
  const play=t=>{if(!player.buffers.get(0))return false;const ok=player.play(0,sample,Number(t)||ctx.currentTime);if(ok)global.dispatchEvent(new CustomEvent("multisynth-live-wire-trigger-visual",{detail:{instanceId:api.instanceId}}));return ok};
  const onResident=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId)||!d.pcm?.length||!d.sampleRate)return;const b=player.install(0,d.pcm,d.sampleRate);if(b){sample.start=0;sample.end=b.duration}};
  const onManual=e=>{const d=e?.detail||{};if(String(d.instanceId)!==String(api.instanceId))return;play(ctx.currentTime)};
  global.addEventListener("multisynth-live-wire-resident",onResident);
  global.addEventListener("multisynth-live-wire-manual-trigger",onManual);
  return{out,player,sample,play,onResident,onManual};
 },
 setState(){},
 trigger({runtime},packet={}){
  const u=runtime.user;if(!u?.play)return false;
  return u.play(Number(packet.time)||runtime.context.currentTime);
 },
 destroy({runtime}){const u=runtime.user;try{N?.stop?.()}catch(_){}if(u){global.removeEventListener("multisynth-live-wire-resident",u.onResident);global.removeEventListener("multisynth-live-wire-manual-trigger",u.onManual);try{u.player?.stopAll?.()}catch(_){}try{u.player?.buffers?.clear?.()}catch(_){}try{u.out?.disconnect?.()}catch(_){}}},
 serialize:({state})=>({...state}),restore:({saved})=>({...saved})
});
B?.define?.({id:I.LIVE_WIRE,model:"module-builder",version:13,package:{id:I.LIVE_WIRE,version:13,behavior:{audioMode:"shared-resident-pcm-sampler",capture:"hold-to-pcm",copy:"whole-source-to-pcm-library",repeatUntilGo:true,trigger:"manual-pad-or-cv-shared-sampler-timestamped",stateOwnership:"module-builder",destroyStopsTransport:true}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"touchscreen",label:"AUDIO SOURCE",node:"controller.source"},{id:"seek",control:"turntable",label:"PRECISION SEEK · 30 RPM",meta:{unit:"s",gesture:"circular-drag",scale:"1 revolution = 2 seconds"},node:"controller.seek"},{id:"trigger",control:"pad",label:"TRIGGER",node:"controller.trigger"},{id:"pause",control:"button",label:"PAUSE",node:"controller.pause"},{id:"copy",control:"button",label:"COPY TO SAMPLE",node:"controller.copy"},{id:"record",control:"hold",label:"HOLD TO RECORD",node:"controller.record"}],sources:[{id:"source.freesound",type:"networkAudio",mode:"preview"}],actions:[{id:"action.select",type:"selectAudio"},{id:"action.seek",type:"seek"},{id:"action.trigger",type:"trigger"},{id:"action.pause",type:"pause"},{id:"action.copy",type:"copyPcm"},{id:"action.record",type:"savePcm"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.trigger","action.trigger"],["controller.pause","action.pause"],["controller.copy","action.copy"],["controller.record","action.record"],["source.freesound","action.trigger"],["source.freesound","action.copy"],["source.freesound","action.record"]]}});
})(window);
