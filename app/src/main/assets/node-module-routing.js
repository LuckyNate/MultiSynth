"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.RackEngine,C=MS.ModuleContract,A=MS.RackAudioGraph,K=MS.ModuleCapabilities,M=MS.ModuleManifest;if(!E||!C||!A)return;let links=[],queued=false;
function clear(){for(const[a,b]of links)try{a.disconnect(b)}catch(_){}links=[]}
function rackForModule(g,id){return g.racks.find(r=>(r.modules||[]).some(m=>m.id===id))||null}
function moduleRecord(g,id){const r=rackForModule(g,id);return r?.modules?.find(m=>m.id===id)||null}
function runtime(g,id){const r=rackForModule(g,id);if(!r)return null;try{return C.getRuntime(id)}catch(_){try{return E.createModuleRuntime(r.id,id,{audioContext:A.context,native:MS.rack?.native||null})}catch(__){return null}}}
function endpoint(g,ref){const p=E.parseNode(ref);if(!p)return null;if(p.kind==="rack"){const io=A.getRackIO?.(p.id);return p.port==="out"?io?.output:io?.inputMix}const rt=runtime(g,p.id);return p.port==="out"?rt?.output:rt?.input}
function sameRackInternal(g,a,b){const A0=E.parseNode(a),B0=E.parseNode(b);if(A0?.kind!=="module"||B0?.kind!=="module")return false;const ra=rackForModule(g,A0.id),rb=rackForModule(g,B0.id);if(!ra||ra.id!==rb?.id)return false;const active=(ra.modules||[]).filter(m=>m.enabled!==false),ia=active.findIndex(m=>m.id===A0.id),ib=active.findIndex(m=>m.id===B0.id);return ib===ia+1}
function rebuild(){queued=false;clear();const g=E.graph();A.start?.();A.rebuild?.();queueMicrotask(()=>{for(const c of g.connections||[]){const a=E.parseNode(c.from),b=E.parseNode(c.to);if(!a||!b)continue;if(a.kind==="rack"&&b.kind==="rack")continue;if(sameRackInternal(g,c.from,c.to))continue;const from=endpoint(g,c.from),to=endpoint(g,c.to);if(!from||!to)continue;try{from.connect(to);links.push([from,to])}catch(e){console.error("Node edge",c,e)}}})}
function schedule(){if(queued)return;queued=true;queueMicrotask(rebuild)}
E.on("graph-changed",schedule);global.addEventListener("pagehide",clear);schedule();MS.NodeModuleRouting=Object.freeze({rebuild:schedule});
})(window);
