"use strict";
(function(global){
  const Engine=()=>global.MultiSynth?.RackEngine;
  const state={selectedRack:null,dragModule:null};
  function bindModuleOrder(container,rackId,{onOpenModule}={}){
    if(container.__multiSynthOrderCleanup)container.__multiSynthOrderCleanup();
    let held=null,startY=0,startX=0,dragging=false,timer=null,pointerId=null;
    const reset=()=>{if(timer)clearTimeout(timer);timer=null;held=null;dragging=false;pointerId=null;state.dragModule=null};
    const down=e=>{if(e.target.closest("input,button,select,textarea,[data-controls]"))return;const item=e.target.closest("[data-module-id]");if(!item)return;held=item;pointerId=e.pointerId;startY=e.clientY;startX=e.clientX;timer=setTimeout(()=>{dragging=true;state.dragModule=item.dataset.moduleId;item.classList.add("module-dragging");try{item.setPointerCapture(pointerId)}catch(_){}},260)};
    const move=e=>{if(!held||e.pointerId!==pointerId)return;if(!dragging&&Math.hypot(e.clientX-startX,e.clientY-startY)>10){if(timer)clearTimeout(timer);timer=null}if(!dragging)return;const items=[...container.querySelectorAll("[data-module-id]")].filter(x=>x!==held);const before=items.find(x=>e.clientY<x.getBoundingClientRect().top+x.getBoundingClientRect().height/2);if(before)container.insertBefore(held,before);else container.appendChild(held)};
    const up=e=>{if(!held||e.pointerId!==pointerId)return;if(dragging){const order=[...container.querySelectorAll("[data-module-id]")];Engine().moveModule(rackId,held.dataset.moduleId,order.indexOf(held))}else if(Math.hypot(e.clientX-startX,e.clientY-startY)<=10){onOpenModule?.(rackId,held.dataset.moduleId)}held?.classList.remove("module-dragging");reset()};
    const cancel=()=>{held?.classList.remove("module-dragging");reset()};
    container.addEventListener("pointerdown",down);container.addEventListener("pointermove",move);container.addEventListener("pointerup",up);container.addEventListener("pointercancel",cancel);
    container.__multiSynthOrderCleanup=()=>{container.removeEventListener("pointerdown",down);container.removeEventListener("pointermove",move);container.removeEventListener("pointerup",up);container.removeEventListener("pointercancel",cancel);reset()};
  }
  global.MultiSynth=global.MultiSynth||{};
  global.MultiSynth.RackBuilder=Object.freeze({bindModuleOrder,state});
})(window);
