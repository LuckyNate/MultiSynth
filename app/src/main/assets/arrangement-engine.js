"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},KEY="multisynth-arrangements-v1",clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
let serial=0,arrangements=new Map(),timers=new Map();
const uid=()=>`arr-${Date.now().toString(36)}-${(++serial).toString(36)}`;
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,arrangements:[...arrangements.values()]}))}catch(e){console.error("Arrangement save failed",e)}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||"null");for(const a of d?.arrangements||[])if(a?.id)arrangements.set(String(a.id),normalize(a))}catch(e){console.error("Arrangement restore failed",e)}}
function normalize(a){return{id:String(a.id||uid()),name:String(a.name||"Arrangement"),length:Math.max(0,Number(a.length)||0),children:Array.isArray(a.children)?a.children.map(c=>({id:String(c.id||uid()),kind:c.kind==="arrangement"?"arrangement":"cascade",ref:String(c.ref||""),start:Math.max(0,Number(c.start)||0),stop:Math.max(0,Number(c.stop)||0)})).filter(c=>c.ref):[]}}
function create(name="Arrangement"){const a=normalize({name});arrangements.set(a.id,a);save();return clone(a)}
function get(id){const a=arrangements.get(String(id));return a?clone(a):null}
function list(){return[...arrangements.values()].map(clone)}
function contains(root,target,seen=new Set()){root=String(root);target=String(target);if(root===target)return true;if(seen.has(root))return false;seen.add(root);const a=arrangements.get(root);return !!a?.children.some(c=>c.kind==="arrangement"&&contains(c.ref,target,seen))}
function put(raw){const a=normalize(raw);for(const c of a.children)if(c.kind==="arrangement"&&contains(c.ref,a.id))throw new Error("Arrangement cycle rejected");arrangements.set(a.id,a);save();return clone(a)}
function remove(id){stop(id);arrangements.delete(String(id));save()}
function cascadeStart(ref){MS.CascadeRegistry?.start?.(ref)}function cascadeStop(ref){MS.CascadeRegistry?.stop?.(ref)}
function childStart(c){c.kind==="arrangement"?start(c.ref):cascadeStart(c.ref)}function childStop(c){c.kind==="arrangement"?stop(c.ref):cascadeStop(c.ref)}
function start(id){id=String(id);const a=arrangements.get(id);if(!a)return false;stop(id);const set=new Set();timers.set(id,set);for(const c of a.children){set.add(setTimeout(()=>childStart(c),c.start));if(c.stop>c.start)set.add(setTimeout(()=>childStop(c),c.stop))}return true}
function stop(id){id=String(id);const a=arrangements.get(id),set=timers.get(id);if(set)for(const t of set)clearTimeout(t);timers.delete(id);if(a)for(const c of a.children)childStop(c);return !!a}
load();MS.Arrangements=Object.freeze({create,get,list,put,remove,start,stop});
})(window);
