"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)throw new Error("ModuleContract required");
function passthrough(api){const ctx=api.context;if(!ctx)return{input:null,output:null};const input=ctx.createGain(),output=ctx.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{input,output};}
function destroy({runtime}){try{runtime.user?.input?.disconnect();runtime.user?.output?.disconnect();}catch(_){}}
const defs=[
 {type:"quadsynth",displayName:"QuadSynth",category:"instrument",editorUrl:"quadsynth.html",color:"#d89924"},
 {type:"pulsynth",displayName:"Pulsynth",category:"instrument",editorUrl:"pulsynth.html",color:"#39ff66"},
 {type:"sinladder",displayName:"SinLadder",category:"instrument",editorUrl:"sinladder.html",color:"#45e8ff"},
 {type:"razorback",displayName:"Razorback",category:"instrument",editorUrl:"razorback.html",color:"#ff3030"},
 {type:"stinger",displayName:"Stinger",category:"instrument",editorUrl:"stinger.html",color:"#ffe530"},
 {type:"noquarter",displayName:"No Quarter",category:"instrument",editorUrl:"noquarter.html",color:"#4b72ff"},
 {type:"whitman",displayName:"Whitman",category:"sampler",editorUrl:"whitman.html",color:"#6b3f24",resources:["mic","files","storage"]},
 {type:"tapeworm",displayName:"Tapeworm",category:"looper",editorUrl:"tapeworm.html",color:"#8a7d63",resources:["mic","storage"]},
 {type:"hookworm",displayName:"Hookworm",category:"looper",editorUrl:"hookworm.html",color:"#8e6848",resources:["mic","storage"]},
 {type:"randrone",displayName:"Randrone",category:"generator",editorUrl:"drone.html",color:"#8666aa",resources:["storage"]},
 {type:"rhythm32",displayName:"Rhythm32",category:"sequencer",editorUrl:"rhythm32.html",color:"#c54b8c",resources:["midi","storage"]}
];
for(const d of defs){
 try{C.getDefinition(d.type);}catch(_){C.define(Object.assign({version:"rack-1",defaults:{},create:passthrough,destroy,serialize:({state})=>Object.assign({},state),restore:({saved})=>Object.assign({},saved||{})},d));}
}
})(window);
