"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.RackEngine,C=MS.ModuleContract,A=MS.RackAudioGraph,I=MS.ModuleIds;if(!E||!C||!A)return;let links=[],queued=false;
function clear(){for(const[a,b]of links)try{a.disconnect(b)}catch(_){}links=[]}
function rackForModule(g,id){return g.racks.find(r=>(r.modules||[]).some(m=>m.id===id))||null}
function moduleFor(g,id){const r=rackForModule(g,id);return r?.modules?.find(m=>m.id===id)||null}
function runtime(g,id){const r=rackForModule(g,id);if(!r)return null;try{return C.getRuntime(id)}catch(_){try{return E.createModuleRuntime(r.id,id,{audioContext:A.context,native:MS.rack?.native||null})}catch(__){return null}}}
function endpoint(g,ref){const p=E.parseNode(ref);if(!p)return null;if(p.kind==="rack"){const io=A.getRackIO?.(p.id);return p.port==="out"?io?.output:io?.inputMix}const rt=runtime(g,p.id);return p.port==="out"?rt?.output:rt?.input}
function sameRackInternal(g,a,b){const A0=E.parseNode(a),B0=E.parseNode(b);if(A0?.kind!=="module"||B0?.kind!=="module")return false;const ra=rackForModule(g,A0.id),rb=rackForModule(g,B0.id);if(!ra||ra.id!==rb?.id)return false;const active=(ra.modules||[]).filter(m=>m.enabled!==false),ia=active.findIndex(m=>m.id===A0.id),ib=active.findIndex(m=>m.id===B0.id);return ib===ia+1}
function explicitIncoming(g,moduleId){return(g.connections||[]).some(c=>{const b=E.parseNode(c.to);return c.type==="audio"&&b?.kind==="module"&&b.id===moduleId})}
function explicitOutgoing(g,moduleId){return(g.connections||[]).some(c=>{const a=E.parseNode(c.from);return c.type==="audio"&&a?.kind==="module"&&a.id===moduleId})}
function syncUpstreamFlags(g){for(const r of g.racks||[])for(const m of r.modules||[]){const rt=runtime(g,m.id);if(!rt?.rack)continue;const rackIncoming=(g.connections||[]).some(c=>{const b=E.parseNode(c.to);return c.type==="audio"&&b?.kind==="rack"&&b.id===r.id});const on=rackIncoming||explicitIncoming(g,m.id);if(rt.rack.hasUpstream!==on){rt.rack.hasUpstream=on;try{C.update(m.id,{})}catch(_){}}}}
function syncLiveWirePatchState(g){for(const r of g.racks||[])for(const m of r.modules||[]){if(m.type!==I?.LIVE_WIRE)continue;const connected=explicitOutgoing(g,m.id);if(!!m.state?.live!==connected){try{E.setModuleState(r.id,m.id,{live:connected})}catch(e){console.error("Live Wire patch state",e)}}if(connected){try{MS.LiveWireNative?.start?.()}catch(e){console.error("Live Wire capture start",e)}}}}
function suppressPatchedLooseSources(g){for(const r of g.racks||[]){if(!String(r.id).startsWith("nodehost-"))continue;const outgoing=(r.modules||[]).some(m=>explicitOutgoing(g,m.id));if(!outgoing)continue;const io=A.getRackIO?.(r.id);if(!io?.output)continue;try{io.output.disconnect(A.collector)}catch(_){}}}
function rebuild(){queued=false;clear();A.start?.();A.rebuild?.();const g=E.graph();syncUpstreamFlags(g);syncLiveWirePatchState(g);suppressPatchedLooseSources(g);for(const c of g.connections||[]){if(c.type!=="audio")continue;const a=E.parseNode(c.from),b=E.parseNode(c.to);if(!a||!b)continue;if(a.kind==="rack"&&b.kind==="rack")continue;if(sameRackInternal(g,c.from,c.to))continue;const from=endpoint(g,c.from),to=endpoint(g,c.to);if(!from||!to){console.warn("Node audio endpoint unavailable",c);continue}try{from.connect(to);links.push([from,to])}catch(e){console.error("Node edge",c,e)}}}
function schedule(){if(queued)return;queued=true;queueMicrotask(rebuild)}
E.on("graph-changed",schedule);global.addEventListener("pagehide",clear);schedule();MS.NodeModuleRouting=Object.freeze({rebuild:schedule});
})(window);
