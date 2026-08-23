"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},M=()=>MS.ModuleManifest,C=()=>MS.ModuleContract,T=()=>MS.ModuleTaxonomy;
function meta(type){try{return M()?.get(type)||null}catch(_){return null}}
function def(type){try{return C()?.getDefinition(type)||null}catch(_){return null}}
function info(type){const m=meta(type),d=def(type);return{type:String(type||""),name:m?.displayName||d?.displayName||String(type||"MODULE"),family:T()?.familyFor?.(type)||String(m?.category||d?.category||"MODULE").toUpperCase(),theme:m?.themeKey||d?.selectorClass||"",color:m?.color||d?.color||"#8fa7b8"}}
function render(type,{compact=false,extraClass=""}={}){const i=info(type),el=document.createElement("div");el.className=`moduleFaceplate rackModuleIdentity moduleChoice ${i.theme} ${compact?"compact":""} ${extraClass}`.trim();el.style.setProperty("--module-color",i.color);el.innerHTML=`<div class="moduleHead"><strong>${i.name.toUpperCase()}</strong><span>${i.family}</span></div>`;return el}
MS.ModuleFaceplate=Object.freeze({render,info});
})(window);
