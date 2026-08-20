"use strict";
(function(){
const MS=window.MultiSynth||{},M=MS.ModuleManifest,R=MS.RackLibrary,E=MS.RackEngine,F=MS.RackFaceplate,MF=MS.ModuleFaceplate,P=()=>window.MultiSynthNodePlane;
const shell=document.getElementById("nodeBrowser"),items=document.getElementById("nodeBrowserItems"),mods=document.getElementById("browseModules"),racks=document.getElementById("browseRacks"),viewport=document.getElementById("nodeViewport");let tab="modules",insertPoint=null,holdTimer=null,holdStart=null;
if(!shell||!items||!viewport)return;
function nameForRack(id){try{return R?.list()?.find(x=>String(x.id)===String(id))?.name||`Rack ${String(id).slice(-6).toUpperCase()}`}catch(_){return`Rack ${String(id).slice(-6).toUpperCase()}`}}
function close(){shell.classList.add("hidden")}
function openAt(clientX,clientY){const api=P();if(!api)return;insertPoint=api.worldPoint(clientX,clientY);shell.classList.remove("hidden");render();try{navigator.vibrate?.(18)}catch(_){}}
function freeCell(){let row=800000,col=800000;while(E.rackAt(row,col)){col++;if(col>899999){row++;col=800000}}return{row,col}}
function addEmptyRack(){const api=P();if(!api)return;try{const c=freeCell(),id=`rack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;E.addRack(c.row,c.col,{id});R?.registerRack?.(id,`Rack ${(R?.list?.()||[]).length+1}`);api.placeRack(id,insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD RACK")}}
function rackChoice(r,name,onPick){const b=document.createElement("button");b.type="button";b.className="nodeBrowserRackChoice";const visual=F?.render?.(r,{name,compact:true})||document.createTextNode(name);b.appendChild(visual);b.onclick=onPick;return b}
function moduleChoice(m){const b=document.createElement("button");b.type="button";b.className="nodeBrowserModuleChoice";const visual=MF?.render?.(m.id,{status:"ADD",compact:true})||document.createTextNode(m.displayName||m.id);b.appendChild(visual);b.onclick=()=>{const api=P();if(!api)return;try{api.addModuleType(m.id,insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD MODULE")}};return b}
function render(){items.innerHTML="";mods?.classList.toggle("active",tab==="modules");racks?.classList.toggle("active",tab==="racks");if(tab==="modules"){for(const m of M?.all||[])items.appendChild(moduleChoice(m))}else{items.appendChild(rackChoice({id:"new",modules:[]},"NEW EMPTY RACK",addEmptyRack));const gs=(E?.graph?.().racks||[]).filter(r=>!String(r.id).startsWith("nodehost-"));for(const r of gs)items.appendChild(rackChoice(r,nameForRack(r.id),()=>{const api=P();if(!api)return;api.placeRack(r.id,insertPoint);close()}))}}
function cancelHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}holdStart=null}
viewport.addEventListener("pointerdown",e=>{if(e.target.closest(".nodeCard,.nodePort"))return;holdStart={id:e.pointerId,x:e.clientX,y:e.clientY};holdTimer=setTimeout(()=>{if(holdStart){openAt(holdStart.x,holdStart.y);cancelHold()}},550)},true);
viewport.addEventListener("pointermove",e=>{if(!holdStart||e.pointerId!==holdStart.id)return;if(Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12)cancelHold()},true);
viewport.addEventListener("pointerup",cancelHold,true);viewport.addEventListener("pointercancel",cancelHold,true);
document.getElementById("closeNodeBrowser")?.addEventListener("click",close);mods?.addEventListener("click",()=>{tab="modules";render()});racks?.addEventListener("click",()=>{tab="racks";render()});
})();
