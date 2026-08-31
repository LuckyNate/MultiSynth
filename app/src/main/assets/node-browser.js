"use strict";
(function(){
const MS=window.MultiSynth||{},M=MS.ModuleManifest,S=MS.ModuleSelectorUI,P=()=>window.MultiSynthNodePlane;
const shell=document.getElementById("nodeBrowser"),items=document.getElementById("nodeBrowserItems"),viewport=document.getElementById("nodeViewport"),POS_KEY="multisynth.node-graph.positions.v1",MIXER_KEY="mixer:alchemy";let insertPoint=null,holdTimer=null,holdStart=null;
if(!shell||!items||!viewport)return;
function close(){shell.classList.add("hidden")}
function openAt(clientX,clientY){const api=P();if(!api)return;insertPoint=api.worldPoint(clientX,clientY);shell.classList.remove("hidden");render();try{navigator.vibrate?.(18)}catch(_){}}
function pickModule(m){const api=P();if(!api)return;try{api.addModuleType(m.id,insertPoint);close()}catch(e){api.flash?.(e.message||"COULD NOT ADD MODULE")}}
function pickAlchemy(){try{const p=insertPoint||{x:500760,y:500000};let positions={};try{positions=JSON.parse(localStorage.getItem(POS_KEY)||"{}")}catch(_){positions={}}positions[MIXER_KEY]={x:p.x-130,y:p.y-70};localStorage.setItem(POS_KEY,JSON.stringify(positions));close();location.reload()}catch(e){P()?.flash?.(e.message||"COULD NOT PLACE ALCHEMY MIXER")}}
function alchemyChoice(){const b=document.createElement("button");b.type="button";b.dataset.moduleId="alchemy-mixer";b.className="moduleRackStrip rackModuleIdentity alchemy-mixer";b.style.setProperty("--module-color","#9a6734");b.innerHTML="<strong>ALCHEMY MIXER</strong><span>OUTPUT</span>";b.onclick=pickAlchemy;return b}
function render(){items.innerHTML="";items.classList.add("moduleSelectorMode");if(S?.mount){const mounted=S.mount(items,{modules:M?.all||[],onPick:pickModule});mounted?.list?.prepend(alchemyChoice())}else{items.appendChild(alchemyChoice());const e=document.createElement("div");e.className="nodeBrowserEmpty";e.textContent="MODULE SELECTOR UNAVAILABLE";items.appendChild(e)}}
function cancelHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}holdStart=null}
viewport.addEventListener("pointerdown",e=>{if(e.target.closest(".nodeCard,.nodePort"))return;holdStart={id:e.pointerId,x:e.clientX,y:e.clientY};holdTimer=setTimeout(()=>{if(holdStart){openAt(holdStart.x,holdStart.y);cancelHold()}},550)},true);
viewport.addEventListener("pointermove",e=>{if(!holdStart||e.pointerId!==holdStart.id)return;if(Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12)cancelHold()},true);viewport.addEventListener("pointerup",cancelHold,true);viewport.addEventListener("pointercancel",cancelHold,true);
document.getElementById("closeNodeBrowser")?.addEventListener("click",close);
})();