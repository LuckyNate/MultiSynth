"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)throw new Error("ModuleContract required");
function passthrough(api){const ctx=api.context;if(!ctx)return{input:null,output:null};const input=ctx.createGain(),output=ctx.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{input,output};}
function destroy({runtime}){try{runtime.user?.input?.disconnect();runtime.user?.output?.disconnect();}catch(_){}}
const defs=[
 {type:"quadsynth",displayName:"QuadSynth",category:"instrument",editorUrl:"quadsynth.html",color:"#ffb000",selectorClass:"quad",description:"CLICK · SINE · SAW · SQUARE"},
 {type:"pulsynth",displayName:"Pulsynth",category:"instrument",editorUrl:"pulsynth.html",color:"#58ff78",selectorClass:"pulse",description:"THREE-STAGE PWM LADDER"},
 {type:"sinladder",displayName:"SinLadder",category:"instrument",editorUrl:"sinladder.html",color:"#36eaff",selectorClass:"sine",description:"THREE-STAGE SINE HARMONIC LADDER"},
 {type:"razorback",displayName:"Razorback",category:"instrument",editorUrl:"razorback.html",color:"#ff3d42",selectorClass:"saw",description:"TRIANGLE / MOVABLE-PEAK LADDER"},
 {type:"stinger",displayName:"Stinger",category:"instrument",editorUrl:"stinger.html",color:"#ffe64a",selectorClass:"stinger",description:"POINTED SPINE CLICK LADDER"},
 {type:"noquarter",displayName:"No Quarter",category:"instrument",editorUrl:"noquarter.html",color:"#77a4ff",selectorClass:"noquarter",description:"HAUNTED VELOCITY ELECTRIC PIANO"},
 {type:"whitman",displayName:"Whitman",category:"sampler",editorUrl:"whitman.html",color:"#cdbb94",selectorClass:"whitman",description:"32-STEP PCM SAMPLER",resources:["mic","files","storage"]},
 {type:"tapeworm",displayName:"Tapeworm",category:"looper",editorUrl:"tapeworm.html",color:"#f58ab3",selectorClass:"tapeworm",description:"SHEDDING SEGMENT ECHO",resources:["mic","storage"]},
 {type:"hookworm",displayName:"Hookworm",category:"looper",editorUrl:"hookworm.html",color:"#e98232",selectorClass:"hookworm",description:"VARIABLE-SPEED CONTINUOUS TAPE LOOP",resources:["mic","storage"]},
 {type:"randrone",displayName:"Randrone",category:"generator",editorUrl:"drone.html",color:"#9efcff",selectorClass:"drone",description:"ENDLESS GENERATIVE SOUND",resources:["storage"]},
 {type:"rhythm32",displayName:"Rhythm32",category:"sequencer",editorUrl:"rhythm32.html",color:"#f4f4f0",selectorClass:"rhythm",description:"32-STEP DRUM SYNTH · PATTERN · SYNC",resources:["midi","storage"]}
];
for(const d of defs){try{C.getDefinition(d.type);}catch(_){C.define(Object.assign({version:"rack-1",defaults:{},create:passthrough,destroy,serialize:({state})=>Object.assign({},state),restore:({saved})=>Object.assign({},saved||{})},d));}}
})(window);
