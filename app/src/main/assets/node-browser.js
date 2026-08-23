"use strict";
(function(){
const MS=window.MultiSynth||{},M=MS.ModuleManifest,E=MS.RackEngine,F=MS.RackFaceplate,S=MS.ModuleSelectorUI,P=()=>window.MultiSynthNodePlane;
const shell=document.getElementById("nodeBrowser"),items=document.getElementById("nodeBrowserItems"),mods=document.getElementById("browseModules"),racks=document.getElementById("browseRacks"),viewport=document.getElementById("nodeViewport");let tab="modules",insertPoint=null,holdTimer=null,holdStart=null;
if(!shell||!items||!viewport)return;
const isDefinition=r=>!String(r.id).startsWith("nodehost-")&&!String(r.id).startsWith("nodeinst-");
function close(){shell.classList.add("hidden")}
function openAt(clientX,clientY){const api=P();if(!api)return;insertPoint=api.worldPoint(clientX,clientY);shell.classList.remove("hidden");render();try{navigator.vibrate?.(18)}catch(_){}}
function addEmptyRack(){const api=P();if(!api)return;try{api.addEmptyRackInstance(insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD RACK INSTANCE")}}
function rackChoice(r,onPick){const b=document.createElement("button");b.type="button";b.className="nodeBrowserRackChoice";const visual=F?.render?.(r,{name:String(r.name||r.id),selector:true})||document.createTextNode(String(r.name||r.id));b.appendChild(visual);b.onclick=onPick;return b}
function pickModule(m){const api=P();if(!api)return;try{api.addModuleType(m.id,insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD MODULE")}}
function pickRack(r){const api=P();if(!api)return;try{api.instantiateRack(r,insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD RACK INSTANCE")}}
function render(){items.innerHTML="";items.classList.toggle("moduleSelectorMode",tab==="modules");items.classList.toggle("rackSelectorMode",tab==="racks");mods?.classList.toggle("active",tab==="modules");racks?.classList.toggle("active",tab==="racks");if(tab==="modules"){if(S?.mount)S.mount(items,{modules:M?.all||[],onPick:pickModule});else{const e=document.createElement("div");e.className="nodeBrowserEmpty";e.textContent="MODULE SELECTOR UNAVAILABLE";items.appendChild(e)}}else{items.appendChild(rackChoice({id:"new",name:"NEW EMPTY RACK",modules:[]},addEmptyRack));for(const r of (E?.graph?.().racks||[]).filter(isDefinition))items.appendChild(rackChoice(r,()=>pickRack(r)))}}
function cancelHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}holdStart=null}
viewport.addEventListener("pointerdown",e=>{if(e.target.closest(".nodeCard,.nodePort"))return;holdStart={id:e.pointerId,x:e.clientX,y:e.clientY};holdTimer=setTimeout(()=>{if(holdStart){openAt(holdStart.x,holdStart.y);cancelHold()}},550)},true);
viewport.addEventListener("pointermove",e=>{if(!holdStart||e.pointerId!==holdStart.id)return;if(Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12)cancelHold()},true);viewport.addEventListener("pointerup",cancelHold,true);viewport.addEventListener("pointercancel",cancelHold,true);
document.getElementById("closeNodeBrowser")?.addEventListener("click",close);mods?.addEventListener("click",()=>{tab="modules";render()});racks?.addEventListener("click",()=>{tab="racks";render()});
})();