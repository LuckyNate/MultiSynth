"use strict";
(function(){
const MS=window.MultiSynth||{},M=MS.ModuleManifest,S=MS.ModuleSelectorUI,P=()=>window.MultiSynthNodePlane;
const shell=document.getElementById("nodeBrowser"),items=document.getElementById("nodeBrowserItems"),viewport=document.getElementById("nodeViewport");let insertPoint=null,holdTimer=null,holdStart=null;
if(!shell||!items||!viewport)return;
function close(){shell.classList.add("hidden")}
function openAt(clientX,clientY){const api=P();if(!api)return;insertPoint=api.worldPoint(clientX,clientY);shell.classList.remove("hidden");render();try{navigator.vibrate?.(18)}catch(_){}}
function pickModule(m){const api=P();if(!api)return;try{api.addModuleType(m.id,insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD MODULE")}}
function render(){items.innerHTML="";items.classList.add("moduleSelectorMode");if(S?.mount)S.mount(items,{modules:M?.all||[],onPick:pickModule});else{const e=document.createElement("div");e.className="nodeBrowserEmpty";e.textContent="MODULE SELECTOR UNAVAILABLE";items.appendChild(e)}}
function cancelHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}holdStart=null}
viewport.addEventListener("pointerdown",e=>{if(e.target.closest(".nodeCard,.nodePort"))return;holdStart={id:e.pointerId,x:e.clientX,y:e.clientY};holdTimer=setTimeout(()=>{if(holdStart){openAt(holdStart.x,holdStart.y);cancelHold()}},550)},true);
viewport.addEventListener("pointermove",e=>{if(!holdStart||e.pointerId!==holdStart.id)return;if(Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12)cancelHold()},true);viewport.addEventListener("pointerup",cancelHold,true);viewport.addEventListener("pointercancel",cancelHold,true);
document.getElementById("closeNodeBrowser")?.addEventListener("click",close);
})();