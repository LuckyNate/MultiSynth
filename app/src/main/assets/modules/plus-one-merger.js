"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={};
function create(api){const output=api.context.createGain(),inputs=new Map(),u={output,inputs,input(index){index=Math.max(0,index|0);let g=inputs.get(index);if(!g){g=api.context.createGain();g.connect(output);inputs.set(index,g)}return g}};api.setInput(u.input(0));api.setOutput(output);return u}
function destroy({runtime}){for(const g of runtime.user?.inputs?.values?.()||[])try{g.disconnect()}catch(_){}try{runtime.user?.output?.disconnect()}catch(_){}}
C.define({type:I.PLUS_ONE_MERGER,version:"module-1",description:"USED +1 CARRIER MERGER",dynamicPorts:{carrierIn:"used-plus-one"},defaults,create,destroy,serialize:()=>({}),restore:()=>({})});
C.defineSurface(I.PLUS_ONE_MERGER,{family:"ROUTING",version:1,package:{id:I.PLUS_ONE_MERGER,version:1,behavior:{role:"used-plus-one-merger",inputs:"used-plus-one",stateOwnership:"graph"}},faceplate:{livery:"routing",primary:"#332410",secondary:"#ffb86e",tertiary:"#fff0df"},defaults,controls:[],sources:[{id:"source.inputs",type:"audioInput",mode:"dynamic-used-plus-one"}],actions:[{id:"action.merge",type:"carrierMerge"}],nodes:{connections:[["source.inputs","action.merge"]]}});
})(window);

(function(global){
if(global.parent===global)return;const q=new URLSearchParams(global.location.search),instance=q.get("instance"),E=global.parent.MultiSynth?.NodeGraphEngine,out=document.getElementById("ratio"),detail=document.getElementById("detail");if(!instance||!E||!out)return;
function render(){const used=(E.graph().connections||[]).map(c=>E.parseNode(c.to)).filter(p=>p?.id===instance&&p.index!=null).length,n=Math.max(1,used);out.textContent=`${n}/1`;if(detail)detail.textContent=`${used} INPUT${used===1?"":"S"} CONNECTED · +1 READY`}
render();E.on?.("graph-changed",render);
})(window);
