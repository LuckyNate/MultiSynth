"use strict";

/* Touch-first interaction controller for MultiSynth spatial racks and cascades. */
(function(global){
    const Engine=()=>global.MultiSynth?.RackEngine;
    const state={selectedRack:null,dragRack:null,dragModule:null};

    function zoomGesture(){return !!document.getElementById("gridViewport")?.dataset?.zoomGesture;}
    function nearestCell(grid,x,y){const el=document.elementFromPoint(x,y)?.closest?.("[data-rack-row][data-rack-col]");if(!el||!grid.contains(el))return null;return{row:Number(el.dataset.rackRow),col:Number(el.dataset.rackCol),element:el};}

    function bindGrid(grid,{onOpenRack,onEmptyCell,onPreview}={}){
        let pressTimer=null,start=null,dragging=false,rackId=null;
        const clear=()=>{if(pressTimer)clearTimeout(pressTimer);pressTimer=null;start=null;dragging=false;rackId=null;};
        grid.addEventListener("pointerdown",e=>{if(zoomGesture())return;const cell=e.target.closest("[data-rack-row][data-rack-col]");if(!cell)return;const rack=cell.querySelector("[data-rack-id]");rackId=rack?.dataset.rackId||null;start={x:e.clientX,y:e.clientY,cell,pointerId:e.pointerId};if(rackId)pressTimer=setTimeout(()=>{if(zoomGesture()){clear();return}dragging=true;state.dragRack=rackId;cell.setPointerCapture?.(e.pointerId);cell.classList.add("rack-dragging");},300);});
        grid.addEventListener("pointermove",e=>{if(!start||e.pointerId!==start.pointerId)return;if(zoomGesture()){clear();return}if(!dragging&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>12){if(pressTimer)clearTimeout(pressTimer);pressTimer=null;}if(dragging){const target=nearestCell(grid,e.clientX,e.clientY);onPreview?.(rackId,target,Engine().neighborhood(rackId));}});
        grid.addEventListener("pointerup",e=>{if(!start||e.pointerId!==start.pointerId)return;if(zoomGesture()){document.querySelectorAll(".rack-dragging").forEach(x=>x.classList.remove("rack-dragging"));state.dragRack=null;clear();return;}const target=nearestCell(grid,e.clientX,e.clientY);if(dragging&&rackId&&target){try{Engine().moveRack(rackId,target.row,target.col);}catch(err){global.dispatchEvent(new CustomEvent("multisynth-rack-ui-error",{detail:err.message}));}}else if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<=12){if(rackId){state.selectedRack=rackId;onOpenRack?.(rackId);}else if(target)onEmptyCell?.(target.row,target.col);}document.querySelectorAll(".rack-dragging").forEach(x=>x.classList.remove("rack-dragging"));state.dragRack=null;clear();});
        grid.addEventListener("pointercancel",()=>{document.querySelectorAll(".rack-dragging").forEach(x=>x.classList.remove("rack-dragging"));state.dragRack=null;clear();});
    }

    function bindCascade(container,rackId,{onOpenModule}={}){
        if(container.__multiSynthCascadeCleanup)container.__multiSynthCascadeCleanup();
        let held=null,startY=0,startX=0,dragging=false,timer=null;
        const reset=()=>{if(timer)clearTimeout(timer);timer=null;held=null;dragging=false;state.dragModule=null;};
        const down=e=>{if(e.target.closest("input,button,select,textarea,[data-controls]"))return;const item=e.target.closest("[data-module-id]");if(!item)return;held=item;startY=e.clientY;startX=e.clientX;timer=setTimeout(()=>{dragging=true;state.dragModule=item.dataset.moduleId;item.classList.add("module-dragging");item.setPointerCapture?.(e.pointerId);},260);};
        const move=e=>{if(!held)return;if(!dragging&&Math.hypot(e.clientX-startX,e.clientY-startY)>10){if(timer)clearTimeout(timer);timer=null;}if(!dragging)return;const items=[...container.querySelectorAll("[data-module-id]")].filter(x=>x!==held);const before=items.find(x=>e.clientY<x.getBoundingClientRect().top+x.getBoundingClientRect().height/2);if(before)container.insertBefore(held,before);else container.appendChild(held);};
        const up=e=>{if(!held)return;if(dragging){const order=[...container.querySelectorAll("[data-module-id]")];Engine().moveModule(rackId,held.dataset.moduleId,order.indexOf(held));}else if(Math.hypot(e.clientX-startX,e.clientY-startY)<=10){onOpenModule?.(rackId,held.dataset.moduleId);}held?.classList.remove("module-dragging");reset();};
        const cancel=()=>{held?.classList.remove("module-dragging");reset();};
        container.addEventListener("pointerdown",down);container.addEventListener("pointermove",move);container.addEventListener("pointerup",up);container.addEventListener("pointercancel",cancel);
        container.__multiSynthCascadeCleanup=()=>{container.removeEventListener("pointerdown",down);container.removeEventListener("pointermove",move);container.removeEventListener("pointerup",up);container.removeEventListener("pointercancel",cancel);reset();};
    }

    function neighborhoodClasses(rackId){const n=Engine().neighborhood(rackId),map=new Map();n.parents.forEach(id=>map.set(id,"rack-parent"));n.siblings.forEach(id=>map.set(id,"rack-sibling"));n.children.forEach(id=>map.set(id,"rack-child"));return map;}
    global.MultiSynth=global.MultiSynth||{};global.MultiSynth.RackBuilder=Object.freeze({bindGrid,bindCascade,neighborhoodClasses,state});
})(window);
