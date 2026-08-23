"use strict";
(function(){
const MS=window.MultiSynth||{},M=MS.ModuleManifest,T=MS.ModuleTaxonomy,E=MS.RackEngine,list=document.getElementById("moduleOrder");
if(!M||!T)return;
function simplifyRack(){if(!list||!E)return;const q=new URLSearchParams(location.search),rackId=q.get("selected")||q.get("rack")||"";let rack;try{rack=E.getRack(rackId)}catch(_){return}for(const card of list.querySelectorAll(".moduleCard[data-module-id]")){const mod=rack.modules.find(x=>x.id===card.dataset.moduleId);if(!mod)continue;const meta=M.get(mod.type),name=meta?.displayName||mod.displayName||mod.type,fam=T.familyFor(mod.type);card.innerHTML=`<div class="moduleHead"><strong>${String(name).toUpperCase()}</strong><span>${fam}</span></div>`}}
new MutationObserver(simplifyRack).observe(list||document.body,{childList:true,subtree:true});simplifyRack();
})();