"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={};
function create(api){const input=api.context.createGain(),output=api.context.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{input,output,emit:api.emit}}
function midiMessage({runtime},packet){runtime.user?.emit?.("midi",packet);return true}
function destroy({runtime}){try{runtime.user?.input?.disconnect()}catch(_){}try{runtime.user?.output?.disconnect()}catch(_){}}
C.define({type:I.PLUS_ONE_SPLITTER,version:"any-signal-1",description:"USED +1 ANY-SIGNAL SPLITTER",dynamicPorts:{carrierOut:"used-plus-one"},defaults,create,midiMessage,destroy,serialize:()=>({}),restore:()=>({})});
C.defineSurface(I.PLUS_ONE_SPLITTER,{family:"ROUTING",version:2,package:{id:I.PLUS_ONE_SPLITTER,version:2,behavior:{role:"used-plus-one-any-signal-splitter",signals:["carrier","midi","clock"],outputs:"used-plus-one",stateOwnership:"graph"}},faceplate:{livery:"routing",primary:"#102733",secondary:"#6ec7ff",tertiary:"#dff6ff"},defaults,controls:[],sources:[{id:"source.carrier",type:"audioInput"},{id:"source.midi",type:"midiInput"},{id:"source.clock",type:"clockInput"}],actions:[{id:"action.split",type:"same-domainFanOut"}],nodes:{connections:[["source.carrier","action.split"],["source.midi","action.split"],["source.clock","action.split"]]}});
})(window);

(function(global){
if(global.parent===global)return;const q=new URLSearchParams(global.location.search),instance=q.get("instance"),E=global.parent.MultiSynth?.NodeGraphEngine,out=document.getElementById("ratio"),detail=document.getElementById("detail");if(!instance||!E||!out)return;
function render(){const used=(E.graph().connections||[]).filter(c=>E.parseNode(c.from)?.id===instance).length,n=Math.max(1,used);out.textContent=`1/${n}`;if(detail)detail.textContent=`${used} OUTPUT${used===1?"":"S"} CONNECTED · +1 READY · ANY SIGNAL`}
render();E.on?.("graph-changed",render);
})(window);
