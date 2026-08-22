"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},D=MS.ControlDescriptors,V=MS.Events;
function getPath(obj,path){return String(path||"").split(".").filter(Boolean).reduce((v,k)=>v?.[/^\d+$/.test(k)?Number(k):k],obj)}
function setPlain(el,v){if(typeof el.setRackValue==="function"){el.setRackValue(v);return}if(el instanceof HTMLInputElement){if(el.type==="checkbox"||el.type==="radio")el.checked=!!v;else if(v!=null)el.value=String(v);const o=el.parentElement?.querySelector?.("output");if(o)o.textContent=el.value;return}if(el instanceof HTMLSelectElement||el instanceof HTMLTextAreaElement){if(v!=null)el.value=String(v);return}if(el instanceof HTMLButtonElement&&typeof v==="boolean"){el.classList.toggle("active",v);const base=(el.dataset.syncLabel||el.textContent.split(":")[0]||"").trim();if(base){el.dataset.syncLabel=base;el.textContent=base+": "+(v?"ON":"OFF")}}}
function descriptor(el){try{return D?.annotate(el)||null}catch(_){return null}}
function activeLiveControl(doc){const a=doc?.activeElement;if(a?.matches?.(".rackKnob,.rackDial,.deviceKnob,[data-live-control='1']"))return a;return doc?.querySelector?.(".rackKnob.active,.rackDial.active,.deviceKnob.active,[data-live-control='1'].active")||null}
function sync(doc,state){if(!doc||!state)return;const win=doc.defaultView,live=activeLiveControl(doc),sx=win?.scrollX||0,sy=win?.scrollY||0;doc.querySelectorAll("[data-state-key],input[id],select[id],textarea[id],button[id]").forEach(el=>{if(live&&(el===live||el.contains?.(live)||live.contains?.(el)))return;const d=descriptor(el),key=d?.key||el.dataset.stateKey||el.id;if(!key)return;const v=key.includes(".")?getPath(state,key):state[key];if(v!==undefined)setPlain(el,v)});try{win?.dispatchEvent(new CustomEvent("multisynth-state-sync",{detail:state}))}catch(_){}if(win){try{win.scrollTo(sx,sy)}catch(_){}win.requestAnimationFrame?.(()=>{try{win.scrollTo(sx,sy)}catch(_){}})}}
function openFrame(){return document.getElementById("moduleEditorFrame")}
const rackEvent=V?.RACK_ENGINE||"multisynth-rack-engine",onRack=e=>{if(e.detail?.type!=="module-state")return;const p=e.detail.payload||{},frame=openFrame();if(!frame?.contentDocument)return;let iid=null;try{iid=new URL(frame.src,location.href).searchParams.get("instance")}catch(_){}if(iid!==p.moduleId)return;sync(frame.contentDocument,p.state)};
if(V?.listen)V.listen(rackEvent,onRack);else global.addEventListener(rackEvent,onRack);
MS.EditorStateBridge=Object.freeze({sync});
})(window);
