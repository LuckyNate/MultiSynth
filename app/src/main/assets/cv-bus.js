"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},E=()=>MS.NodeGraphEngine,C=()=>MS.ModuleContract,A=()=>MS.NodeAudioGraph;
const clone=v=>v==null?v:(typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v)));
function runtime(mid){const m=E().getModule(mid);if(!m)return null;try{return C().getRuntime(mid)}catch(_){try{return E().createModuleRuntime(mid,{audioContext:A()?.context,native:null,node:{hasUpstream:false}})}catch(__){return null}}}
function targets(g,moduleId){const out=[];for(const e of g.connections||[]){if(e.type!=="cv")continue;const a=E().parseNode(e.from),b=E().parseNode(e.to);if(a?.signal==="cv"&&b?.signal==="cv"&&a.id===moduleId)out.push(b.id)}return[...new Set(out)]}
function walk(g,moduleId,packet,seen){const key=moduleId+":"+(packet?.serial||"");if(seen.has(key))return;seen.add(key);const rt=runtime(moduleId);if(!rt)return;let out=clone(packet);try{out=C().cv(moduleId,out)}catch(e){console.error("CV",e)}if(out==null)return;for(const next of targets(g,moduleId))walk(g,next,clone(out),seen)}
function send(sourceModuleId,packet={}){const g=E().graph();if(!E().getModule(sourceModuleId))return false;const out=Object.assign({kind:"trigger",source:sourceModuleId,time:A()?.context?.currentTime||0,serial:Date.now()+":"+Math.random()},packet||{});for(const target of targets(g,sourceModuleId))walk(g,target,clone(out),new Set());return true}
MS.CvBus=Object.freeze({send});
})(window);
