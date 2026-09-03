"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.NodeGraphEngine,MF=MS.ModuleFaceplate,world=document.getElementById("nodeWorld");if(!E||!MF||!world)return;
function findModule(id){return E.getModule?.(String(id))||null}
function upgrade(card){if(!card||card.dataset.nodeKind!=="module"||card.dataset.moduleFaceplateReady==="1")return;const m=findModule(card.dataset.nodeId);if(!m)return;const i=MF.info(m.type),head=card.querySelector(".nodeHead"),body=card.querySelector(".nodeBody");card.classList.add("rackModuleIdentity",i.theme||"");card.style.setProperty("--module-color",i.color);if(head){head.classList.add("moduleHead");head.innerHTML=`<strong>${i.name.toUpperCase()}</strong><span>${String(i.description||"").toUpperCase()}</span>`}if(body)body.innerHTML="";card.dataset.moduleFaceplateReady="1"}
function scan(){world.querySelectorAll('.nodeCard[data-node-kind="module"]').forEach(upgrade)}
new MutationObserver(scan).observe(world,{childList:true,subtree:true});E.on?.("graph-changed",()=>requestAnimationFrame(scan));scan();
})(window);
