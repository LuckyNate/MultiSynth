"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.RackEngine,H=MS.HierarchyLibrary,F=MS.RackFaceplate,world=document.getElementById("nodeWorld");if(!E||!F||!world)return;
function nameFor(id){try{return H?.list?.("rack")?.find(x=>String(x.id)===String(id))?.name||`Rack ${String(id).slice(-6).toUpperCase()}`}catch(_){return`Rack ${String(id).slice(-6).toUpperCase()}`}}
function rackFor(id){return(E.graph().racks||[]).find(r=>String(r.id)===String(id))||null}
function upgrade(card){if(!card||card.dataset.nodeKind!=="rack"||card.dataset.faceplateReady==="1")return;const rack=rackFor(card.dataset.nodeId);if(!rack)return;const inPort=card.querySelector(".nodePort.in"),outPort=card.querySelector(".nodePort.out"),dragHead=card.querySelector(".nodeHead"),visual=F.render(rack,{name:nameFor(rack.id),selected:card.classList.contains("selected")});visual.classList.add("nodeRackFaceplate");visual.querySelector(".rackFaceplateScope")?.addEventListener("click",e=>{e.stopPropagation();global.MultiSynthNodePlane?.openRackEditor?.(rack.id)});visual.querySelector(".rackFaceplateModules")?.addEventListener("click",e=>{e.stopPropagation();global.MultiSynthNodePlane?.openRackEditor?.(rack.id)});card.innerHTML="";if(inPort)card.appendChild(inPort);card.appendChild(visual);if(dragHead){dragHead.classList.add("rackDragProxy");dragHead.innerHTML="";card.appendChild(dragHead)}if(outPort)card.appendChild(outPort);card.classList.add("rackVisualNode");card.dataset.faceplateReady="1"}
function scan(){world.querySelectorAll('.nodeCard[data-node-kind="rack"]').forEach(upgrade)}
new MutationObserver(scan).observe(world,{childList:true,subtree:true});E.on?.("graph-changed",()=>requestAnimationFrame(scan));scan();
})(window);
