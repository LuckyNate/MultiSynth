"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={};
function create(api){const output=api.context.createGain(),inputs=new Map(),u={output,inputs,emit:api.emit,input(index){index=Math.max(0,index|0);let g=inputs.get(index);if(!g){g=api.context.createGain();g.connect(output);inputs.set(index,g)}return g}};api.setInput(u.input(0));api.setOutput(output);return u}
function midiMessage({runtime},packet){runtime.user?.emit?.("midi",packet);return true}
function destroy({runtime}){for(const g of runtime.user?.inputs?.values?.()||[])try{g.disconnect()}catch(_){}try{runtime.user?.output?.disconnect()}catch(_){}}
C.define({type:I.PLUS_ONE_MERGER,version:"any-signal-1",description:"USED +1 ANY-SIGNAL MERGER",dynamicPorts:{carrierIn:"used-plus-one"},defaults,create,midiMessage,destroy,serialize:()=>({}),restore:()=>({})});
C.defineSurface(I.PLUS_ONE_MERGER,{family:"ROUTING",version:2,package:{id:I.PLUS_ONE_MERGER,version:2,behavior:{role:"used-plus-one-any-signal-merger",signals:["carrier","midi","clock"],inputs:"used-plus-one",stateOwnership:"graph"}},faceplate:{livery:"routing",primary:"#332410",secondary:"#ffb86e",tertiary:"#fff0df"},defaults,controls:[],sources:[{id:"source.carrier",type:"audioInput"},{id:"source.midi",type:"midiInput"},{id:"source.clock",type:"clockInput"}],actions:[{id:"action.merge",type:"same-domainMerge"}],nodes:{connections:[["source.carrier","action.merge"],["source.midi","action.merge"],["source.clock","action.merge"]]}});
})(window);

(function(global){
if(global.parent===global)return;const q=new URLSearchParams(global.location.search),instance=q.get("instance"),E=global.parent.MultiSynth?.NodeGraphEngine,out=document.getElementById("ratio"),detail=document.getElementById("detail");if(!instance||!E||!out)return;
function render(){const used=(E.graph().connections||[]).filter(c=>E.parseNode(c.to)?.id===instance).length,n=Math.max(1,used);out.textContent=`${n}/1`;if(detail)detail.textContent=`${used} INPUT${used===1?"":"S"} CONNECTED · +1 READY · ANY SIGNAL`}
render();E.on?.("graph-changed",render);
})(window);
