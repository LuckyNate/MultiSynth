"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},KEY="multisynth-arrangements-v1",clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
let serial=0,arrangements=new Map(),timers=new Map();
const uid=()=>`arr-${Date.now().toString(36)}-${(++serial).toString(36)}`;
function rackEngine(){return MS.RackEngine}
function cascade(ref){try{return rackEngine()?.getRack?.(String(ref))||null}catch(_){return null}}
function requireCascade(ref){const c=cascade(ref);if(!c)throw new Error("Unknown cascade: "+ref);return c}
function touchCascade(){try{global.dispatchEvent(new CustomEvent("multisynth-cascade-edited"))}catch(_){}}
const CascadeRegistry=Object.freeze({
 get:ref=>clone(cascade(ref)),
 list:()=>clone(rackEngine()?.graph?.().racks||[]),
 exists:ref=>!!cascade(ref),
 addModule(ref,type,state,index){requireCascade(ref);const id=rackEngine().addModule(String(ref),type,state,index);touchCascade();return id},
 removeModule(ref,moduleId){requireCascade(ref);rackEngine().removeModule(String(ref),moduleId);touchCascade();return true},
 moveModule(ref,moduleId,index){requireCascade(ref);rackEngine().moveModule(String(ref),moduleId,index);touchCascade();return true},
 setModuleState(ref,moduleId,patch){requireCascade(ref);rackEngine().setModuleState(String(ref),moduleId,patch);touchCascade();return true},
 setGain(ref,gain){const E=rackEngine(),r=requireCascade(ref),g=Number(gain);if(!Number.isFinite(g))throw new Error("Invalid cascade gain");if(typeof E.setRackGain==="function")E.setRackGain(String(ref),g);else throw new Error("Cascade gain editing unavailable");touchCascade();return clone(r)},
 start(ref){const r=requireCascade(ref);if(typeof rackEngine().startCascade==="function")return rackEngine().startCascade(r.id);return true},
 stop(ref){const r=requireCascade(ref);if(typeof rackEngine().stopCascade==="function")return rackEngine().stopCascade(r.id);return true}
});
MS.CascadeRegistry=CascadeRegistry;
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,arrangements:[...arrangements.values()]}))}catch(e){console.error("Arrangement save failed",e)}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||"null");for(const a of d?.arrangements||[])if(a?.id)arrangements.set(String(a.id),normalize(a))}catch(e){console.error("Arrangement restore failed",e)}}
function normalize(a){return{id:String(a.id||uid()),name:String(a.name||"Arrangement"),length:Math.max(0,Number(a.length)||0),children:Array.isArray(a.children)?a.children.map(c=>({id:String(c.id||uid()),kind:c.kind==="arrangement"?"arrangement":"cascade",ref:String(c.ref||""),start:Math.max(0,Number(c.start)||0),stop:Math.max(0,Number(c.stop)||0)})).filter(c=>c.ref):[]}}
function create(name="Arrangement"){const a=normalize({name});arrangements.set(a.id,a);save();return clone(a)}
function get(id){const a=arrangements.get(String(id));return a?clone(a):null}
function list(){return[...arrangements.values()].map(clone)}
function resolveChild(c){if(!c)return null;if(c.kind==="arrangement")return get(c.ref);return CascadeRegistry.get(c.ref)}
function resolve(id){const a=get(id);if(!a)return null;return{...a,children:a.children.map(c=>({...c,target:resolveChild(c)}))}}
function contains(root,target,seen=new Set()){root=String(root);target=String(target);if(root===target)return true;if(seen.has(root))return false;seen.add(root);const a=arrangements.get(root);return !!a?.children.some(c=>c.kind==="arrangement"&&contains(c.ref,target,seen))}
function put(raw){const a=normalize(raw);for(const c of a.children){if(c.kind==="arrangement"&&contains(c.ref,a.id))throw new Error("Arrangement cycle rejected");if(c.kind==="cascade"&&!CascadeRegistry.exists(c.ref))throw new Error("Unknown cascade reference: "+c.ref)}arrangements.set(a.id,a);save();return clone(a)}
function remove(id){stop(id);arrangements.delete(String(id));save()}
function cascadeStart(ref){CascadeRegistry.start(ref)}function cascadeStop(ref){CascadeRegistry.stop(ref)}
function childStart(c){c.kind==="arrangement"?start(c.ref):cascadeStart(c.ref)}function childStop(c){c.kind==="arrangement"?stop(c.ref):cascadeStop(c.ref)}
function start(id){id=String(id);const a=arrangements.get(id);if(!a)return false;stop(id);const set=new Set();timers.set(id,set);for(const c of a.children){set.add(setTimeout(()=>childStart(c),c.start));if(c.stop>c.start)set.add(setTimeout(()=>childStop(c),c.stop))}return true}
function stop(id){id=String(id);const a=arrangements.get(id),set=timers.get(id);if(set)for(const t of set)clearTimeout(t);timers.delete(id);if(a)for(const c of a.children)childStop(c);return !!a}
function editCascade(ref,edit){const c=requireCascade(ref);if(typeof edit!=="function")return clone(c);const api={cascade:()=>CascadeRegistry.get(ref),addModule:(type,state,index)=>CascadeRegistry.addModule(ref,type,state,index),removeModule:moduleId=>CascadeRegistry.removeModule(ref,moduleId),moveModule:(moduleId,index)=>CascadeRegistry.moveModule(ref,moduleId,index),setModuleState:(moduleId,patch)=>CascadeRegistry.setModuleState(ref,moduleId,patch)};edit(api);return CascadeRegistry.get(ref)}
load();MS.Arrangements=Object.freeze({create,get,list,resolve,put,remove,start,stop,editCascade});
})(window);
