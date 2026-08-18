"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
const E=()=>MS.RackEngine,C=()=>MS.ModuleContract;
const clone=v=>v==null?v:(typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v)));
function children(g,id){return (g.edges||[]).filter(e=>e.from===id).map(e=>e.to)}
function locate(g,moduleId){for(const r of g.racks||[]){const active=(r.modules||[]).filter(m=>m.enabled!==false),i=active.findIndex(m=>m.id===moduleId);if(i>=0)return{rack:r,index:i}}return null}
function runtime(mid,rack){try{return C().getRuntime(mid)}catch(_){try{return E().createModuleRuntime(rack.id,mid,{audioContext:MS.RackAudioGraph?.context,native:MS.rack?.native||null})}catch(__){return null}}}
function walk(g,rackId,start,packet,seen){const key=rackId+":"+start+":"+(packet?.serial||"");if(seen.has(key))return;seen.add(key);const rack=(g.racks||[]).find(r=>r.id===rackId);if(!rack)return;const active=(rack.modules||[]).filter(m=>m.enabled!==false);let out=clone(packet);for(let i=Math.max(0,start|0);i<active.length&&out!=null;i++){const rt=runtime(active[i].id,rack);if(!rt)continue;const fn=rt.user?.onDiv;if(typeof fn==="function"){try{const v=fn(out);if(v===false||v===null)out=null;else if(v!==undefined)out=v}catch(e){console.error("DIV",e)}}}if(out==null)return;for(const child of children(g,rackId))walk(g,child,0,clone(out),seen)}
function send(sourceModuleId,packet={}){const g=E().graph(),p=locate(g,sourceModuleId);if(!p)return false;const out=Object.assign({kind:"div",source:sourceModuleId,time:MS.RackAudioGraph?.context?.currentTime||0,serial:Date.now()+":"+Math.random()},packet||{});walk(g,p.rack.id,p.index+1,out,new Set());return true}
MS.DivBus=Object.freeze({send});
})(window);
