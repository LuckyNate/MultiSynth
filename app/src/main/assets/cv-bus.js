"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},E=()=>MS.NodeGraphEngine,C=()=>MS.ModuleContract,A=()=>MS.NodeAudioGraph;
const clone=v=>v==null?v:(typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v)));
function runtime(mid){const m=E().getModule(mid);if(!m)return null;try{return C().getRuntime(mid)}catch(_){try{return E().createModuleRuntime(mid,{audioContext:A()?.context,native:null,node:{hasUpstream:false,hasDownstream:false,hasCvUpstream:false,hasCvDownstream:false}})}catch(__){return null}}}
function targets(g,moduleId){const out=[];for(const e of g.connections||[]){if(e.type!=="cv")continue;const a=E().parseNode(e.from),b=E().parseNode(e.to);if(a?.signal==="cv"&&b?.signal==="cv"&&a.id===moduleId)out.push(b.id)}return[...new Set(out)]}
function syncTopology(){const g=E().graph(),incoming=new Set(),outgoing=new Set();for(const e of g.connections||[]){if(e.type!=="cv")continue;const a=E().parseNode(e.from),b=E().parseNode(e.to);if(a?.signal!=="cv"||b?.signal!=="cv")continue;outgoing.add(a.id);incoming.add(b.id)}for(const m of g.modules||[]){const rt=runtime(m.id);if(!rt?.node)continue;const wasIn=!!rt.node.hasCvUpstream,wasOut=!!rt.node.hasCvDownstream,nextIn=incoming.has(m.id),nextOut=outgoing.has(m.id);rt.node.hasCvUpstream=nextIn;rt.node.hasCvDownstream=nextOut;if(wasIn!==nextIn||wasOut!==nextOut)try{C().update(m.id,{})}catch(e){console.error("CV topology",e)}}}
function walk(g,moduleId,packet,seen){const key=moduleId+":"+(packet?.serial||"");if(seen.has(key))return;seen.add(key);const rt=runtime(moduleId);if(!rt)return;let out=clone(packet);try{out=C().cv(moduleId,out)}catch(e){console.error("CV",e)}if(out==null)return;for(const next of targets(g,moduleId))walk(g,next,clone(out),seen)}
function send(sourceModuleId,packet={}){const g=E().graph();if(!E().getModule(sourceModuleId))return false;const out=Object.assign({kind:"trigger",source:sourceModuleId,time:A()?.context?.currentTime||0,serial:Date.now()+":"+Math.random()},packet||{});for(const target of targets(g,sourceModuleId))walk(g,target,clone(out),new Set());return true}
E()?.on?.("graph-changed",()=>queueMicrotask(syncTopology));queueMicrotask(syncTopology);
MS.CvBus=Object.freeze({send,syncTopology});
})(window);
