"use strict";
(function(global){
const E=global.MultiSynth?.RackEngine;
if(!E)return;
function removeRack(id,e){e?.preventDefault();e?.stopPropagation();try{E.removeRack(id);global.MultiSynth.RackBuilder.state.selectedRack=null;document.getElementById('cascadePanel')?.classList.add('hidden');}catch(err){console.error(err);}}
function removeModule(rackId,moduleId,e){e?.preventDefault();e?.stopPropagation();try{E.removeModule(rackId,moduleId);}catch(err){console.error(err);}}
function selectedRack(){return document.querySelector('.rackNode.selected')?.dataset.rackId || global.MultiSynth?.RackBuilder?.state?.selectedRack || null;}
function decorate(){
 const rid=selectedRack();
 const rackDelete=document.getElementById('deleteRackBtn');
 if(rackDelete){rackDelete.onclick=e=>{const id=selectedRack();if(id)removeRack(id,e);};rackDelete.disabled=!rid;}
 document.querySelectorAll('.moduleCard[data-module-id]').forEach(card=>{
   if(card.querySelector('.moduleDelete'))return;
   const b=document.createElement('button');b.type='button';b.className='moduleDelete';b.textContent='×';b.setAttribute('aria-label','Delete module');
   b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{const id=selectedRack();if(id)removeModule(id,card.dataset.moduleId,e);});card.appendChild(b);
 });
}
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
document.addEventListener('DOMContentLoaded',decorate,{once:true});setTimeout(decorate,0);
})(window);
