"use strict";
(function(global){
const E=global.MultiSynth?.RackEngine;
if(!E)return;
function removeRack(id,e){e?.preventDefault();e?.stopPropagation();try{E.removeRack(id);}catch(err){console.error(err);}}
function removeModule(rackId,moduleId,e){e?.preventDefault();e?.stopPropagation();try{E.removeModule(rackId,moduleId);}catch(err){console.error(err);}}
function decorate(){
 document.querySelectorAll('.rackNode[data-rack-id]').forEach(node=>{
   if(node.querySelector('.rackDelete'))return;
   const b=document.createElement('button');b.type='button';b.className='rackDelete';b.textContent='×';b.setAttribute('aria-label','Delete rack');
   b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>removeRack(node.dataset.rackId,e));node.appendChild(b);
 });
 const selected=document.querySelector('.rackNode.selected')?.dataset.rackId || global.MultiSynth?.RackBuilder?.state?.selectedRack || null;
 if(selected)document.querySelectorAll('.moduleCard[data-module-id]').forEach(card=>{
   if(card.querySelector('.moduleDelete'))return;
   const b=document.createElement('button');b.type='button';b.className='moduleDelete';b.textContent='×';b.setAttribute('aria-label','Delete module');
   b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>removeModule(selected,card.dataset.moduleId,e));card.appendChild(b);
 });
}
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',decorate,{once:true});setTimeout(decorate,0);
})(window);
