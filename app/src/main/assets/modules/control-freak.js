"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;
if(!C||!I)return;
const defaults=()=>({channel:1,octave:0,velocity:127,pitch:0,mod:0,ribbon:0.5,xyX:0.5,xyY:0.5,knobs:Array(8).fill(0.5),faders:Array(8).fill(0.75),pads:Array(16).fill(0),mappings:{},padMappings:{}});
function create(api){const c=api.context,input=c.createGain(),output=c.createGain(),analyser=c.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.7;input.connect(output);input.connect(analyser);api.setInput(input);api.setOutput(output);return{id:api.instanceId,input,output,analyser,state:api.state}}
function setState({runtime,state}){const u=runtime.user;if(u)u.state=state}
function destroy({runtime}){for(const n of [runtime.user?.input,runtime.user?.output,runtime.user?.analyser])try{n?.disconnect()}catch(_){}}
C.define({type:I.CONTROL_FREAK,version:"control-freak-placeholder-1",description:"PERFORMANCE KEYBOARD · OSCILLOSCOPE · REBUILD PLACEHOLDER",defaults:defaults(),resources:["midi"],create,setState,destroy,serialize:({state})=>({...state,pitch:0}),restore:({saved})=>Object.assign(defaults(),saved||{},{pitch:0})});
C.defineSurface(I.CONTROL_FREAK,{version:4,package:{id:I.CONTROL_FREAK,version:4,behavior:{role:"performance-controller-placeholder",outputs:["note","midi"],performanceSurface:"control-keyboard.js",stateOwnership:"module"}},faceplate:{livery:"controller-blue",primary:"#071527",secondary:"#75b7ff",tertiary:"#e1f1ff"},defaults:defaults(),controls:[{id:"scope",control:"oscilloscope",label:"",node:"monitor.scope"}],sources:[{id:"source.touch",type:"performanceInput"},{id:"source.midi",type:"midiInput"}],actions:[{id:"action.note",type:"noteOutput"}],nodes:{connections:[]}});
})(window);

(function(global){
if(global.parent===global)return;
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,R=global.MultiSynth?.ControlSurfaceRenderer,PK=global.MultiSynth?.PerformanceKeyboard,root=document.getElementById("controls"),keyboardHost=document.getElementById("performanceKeyboard");
if(!instance||!E||!R||!root)return;
const module=E.getModule(instance);if(!module)return;
root.innerHTML="";
root.classList.add("ms-module-surface");
R.mount(root,{id:"scope",control:"oscilloscope",meta:{visual:{width:320,height:140}}});
if(keyboardHost)PK?.mount?.(keyboardHost,{audio:A});
})(window);
