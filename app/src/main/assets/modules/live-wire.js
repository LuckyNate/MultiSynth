"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions,N=MS.LiveWireNative;
if(!C||!I)return;
const defaults={};
C.define({
 type:I.LIVE_WIRE,version:"module-builder-9",description:"FREESOUND AUDIO PLAYER · 30 RPM PRECISION SEEK · HOLD TO SAMPLE",defaults,
 create(api){
  const ctx=api.context;if(!ctx)return{};
  const out=ctx.createGain();out.gain.value=0;api.setOutput(out);
  return{out};
 },
 setState(){},
 destroy({runtime}){try{N?.stop?.()}catch(_){}try{runtime.user?.out?.disconnect?.()}catch(_){}},
 serialize:({state})=>({...state}),restore:({saved})=>({...saved})
});
B?.define?.({id:I.LIVE_WIRE,model:"module-builder",version:9,package:{id:I.LIVE_WIRE,version:9,behavior:{audioMode:"freesound-player-recorder",capture:"hold-to-pcm",stateOwnership:"module-builder",destroyStopsTransport:true}},faceplate:{livery:"high-voltage-crt",primary:"#081419",secondary:"#72d7ff",tertiary:"#dff7ff"},defaults,controls:[{id:"source",control:"touchscreen",label:"AUDIO SOURCE",node:"controller.source"},{id:"seek",control:"turntable",label:"PRECISION SEEK · 30 RPM",meta:{unit:"s",gesture:"circular-drag",scale:"1 revolution = 2 seconds"},node:"controller.seek"},{id:"pause",control:"button",label:"PAUSE",node:"controller.pause"},{id:"stop",control:"button",label:"STOP",node:"controller.stop"},{id:"record",control:"hold",label:"HOLD TO RECORD",node:"controller.record"}],sources:[{id:"source.freesound",type:"networkAudio",mode:"preview"}],actions:[{id:"action.select",type:"selectAudio"},{id:"action.seek",type:"seek"},{id:"action.pause",type:"pause"},{id:"action.stop",type:"stop"},{id:"action.record",type:"savePcm"}],nodes:{connections:[["controller.source","action.select"],["controller.seek","action.seek"],["controller.pause","action.pause"],["controller.stop","action.stop"],["controller.record","action.record"],["source.freesound","action.record"]]}});
})(window);
