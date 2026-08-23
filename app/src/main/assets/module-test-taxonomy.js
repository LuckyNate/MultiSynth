"use strict";
(function(){
const MS=window.MultiSynth||{},T=MS.ModuleTaxonomy,family=document.getElementById("moduleFamilyInput"),tags=document.getElementById("moduleTagInput"),save=document.getElementById("saveModuleTags");
if(!T)return;
function current(){return new URLSearchParams(location.search).get("module")||""}
function fill(){const id=current();if(family)family.value=id?T.familyFor(id):"";if(tags)tags.value=id?T.userTagsFor(id).join(" "):""}
fill();save?.addEventListener("click",()=>{const id=current();if(!id)return;T.setFamily(id,family?.value||"");T.setUserTags(id,tags?.value||"");fill();save.textContent="SAVED";setTimeout(()=>save.textContent="SAVE",700)});window.addEventListener("popstate",fill);
})();