"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},C=()=>MS.ModuleContract,I=()=>MS.ModuleIds,K=()=>MS.StateKeys;
const modules=new Map(),connections=new Map(),listeners=new Map();let moduleSerial=0,edgeSerial=0;
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const id=(p,n)=>`${p}-${Date.now().toString(36)}-${n.toString(36)}`;
const canonical=t=>I()?.canonicalId?.(t)||String(t||"");
function emit(type,payload){listeners.get(type)?.forEach(fn=>{try{fn(payload)}catch(e){console.error(e)}})}
function on(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);return()=>listeners.get(type)?.delete(fn)}
function ref(mid,port){return`module:${mid}:${port}`}
const moduleIn=mid=>ref(mid,"carrier-in"),moduleOut=mid=>ref(mid,"carrier-out"),moduleCvIn=mid=>ref(mid,"cv-in"),moduleCvOut=mid=>ref(mid,"cv-out");
function parseNode(value){const m=/^module:(.+):(carrier-in|carrier-out|cv-in|cv-out)$/.exec(String(value||""));return m?{kind:"module",id:m[1],port:m[2],signal:m[2].startsWith("cv-")?"cv":"carrier",direction:m[2].endsWith("-out")?"out":"in"}:null}
function snapshotModule(m){return clone(m)}
function graph(){return{standard:"node-graph",modules:[...modules.values()].map(snapshotModule),connections:[...connections.values()].map(clone)}}
function addModule(type,state={}){type=canonical(type);const def=C().getDefinition(type),mid=id("node",++moduleSerial),normalized=K()?.normalizePatch?.(clone(state),def.defaults)||clone(state);modules.set(mid,{id:mid,type,displayName:def.displayName,enabled:true,state:Object.assign({},clone(def.defaults),normalized)});emit("graph-changed",graph());return mid}
function removeModule(mid){mid=String(mid);if(!modules.has(mid))return false;try{C().destroy(mid)}catch(_){}modules.delete(mid);for(const[eid,e]of [...connections]){const a=parseNode(e.from),b=parseNode(e.to);if(a?.id===mid||b?.id===mid)connections.delete(eid)}emit("graph-changed",graph());return true}
function setModuleState(mid,patch){const m=modules.get(String(mid));if(!m)throw new Error(`Unknown module instance: ${mid}`);const p=K()?.normalizePatch?.(patch||{},m.state)||patch||{};Object.assign(m.state,p);try{C().update(m.id,p)}catch(_){}emit("module-state",{moduleId:m.id,state:clone(m.state),patch:clone(p)});return clone(m.state)}
function connectNodes(from,to,type){const a=parseNode(from),b=parseNode(to);if(!a||!b||a.direction!=="out"||b.direction!=="in")throw new Error("Node connection must be OUT → IN");if(a.signal!==b.signal)throw new Error("Carrier and CV ports cannot be crossed");if(!modules.has(a.id)||!modules.has(b.id))throw new Error("Unknown node endpoint");if(a.id===b.id)throw new Error("Cannot connect node to itself");const edgeType=a.signal==="cv"?"cv":"audio";if(type&&type!==edgeType)throw new Error(`Expected ${edgeType.toUpperCase()} connection`);const existing=[...connections.values()].find(x=>x.from===from&&x.to===to&&x.type===edgeType);if(existing)return existing.id;const e={id:id("edge",++edgeSerial),from,to,type:edgeType};connections.set(e.id,e);emit("graph-changed",graph());return e.id}
function disconnectNodes(eid){const ok=connections.delete(String(eid));if(ok)emit("graph-changed",graph());return ok}
function createModuleRuntime(mid,options={}){const m=modules.get(String(mid));if(!m)throw new Error(`Unknown module instance: ${mid}`);return C().createRuntime(m,options)}
function serialize(meta={}){return JSON.stringify({format:"multisynth-node-graph",version:1,meta:clone(meta),modules:[...modules.values()].map(clone),connections:[...connections.values()].map(clone)})}
function restore(raw){const data=typeof raw==="string"?JSON.parse(raw):raw;if(data?.format!=="multisynth-node-graph")throw new Error("Not a MultiSynth node graph project");for(const mid of [...modules.keys()])try{C().destroy(mid)}catch(_){}modules.clear();connections.clear();for(const src of data.modules||[]){const type=canonical(src.type),def=C().getDefinition(type);modules.set(String(src.id),{id:String(src.id),type,displayName:def.displayName,enabled:src.enabled!==false,state:Object.assign({},clone(def.defaults),clone(src.state||{}))})}for(const e of data.connections||[]){const a=parseNode(e.from),b=parseNode(e.to);if(a&&b&&modules.has(a.id)&&modules.has(b.id)&&a.signal===b.signal&&a.direction==="out"&&b.direction==="in")connections.set(String(e.id||id("edge",++edgeSerial)),{id:String(e.id||id("edge",++edgeSerial)),from:e.from,to:e.to,type:a.signal==="cv"?"cv":"audio"})}emit("graph-changed",graph());return clone(data.meta||{})}
function clear(){for(const mid of [...modules.keys()])try{C().destroy(mid)}catch(_){}modules.clear();connections.clear();emit("graph-changed",graph())}
MS.NodeGraphEngine=Object.freeze({graph,on,addModule,removeModule,setModuleState,connectNodes,disconnectNodes,createModuleRuntime,serialize,restore,clear,parseNode,moduleIn,moduleOut,moduleCvIn,moduleCvOut,getModule:id=>{const m=modules.get(String(id));return m?clone(m):null}});
})(window);
