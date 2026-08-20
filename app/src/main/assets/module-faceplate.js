"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},M=()=>MS.ModuleManifest,C=()=>MS.ModuleContract;
function meta(type){try{return M()?.get(type)||null}catch(_){return null}}
function def(type){try{return C()?.getDefinition(type)||null}catch(_){return null}}
function info(type){const m=meta(type),d=def(type);return{type:String(type||""),name:m?.displayName||d?.displayName||String(type||"MODULE"),category:m?.category||d?.category||"module",theme:m?.themeKey||d?.selectorClass||"",color:m?.color||d?.color||"#8fa7b8",description:d?.description||m?.description||m?.category||d?.category||"MODULE"}}
function render(type,{status="MODULE",compact=false,extraClass=""}={}){const i=info(type),el=document.createElement("div");el.className=`moduleFaceplate rackModuleIdentity moduleChoice ${i.theme} ${compact?"compact":""} ${extraClass}`.trim();el.style.setProperty("--module-color",i.color);el.innerHTML=`<span class="miniStatus">${String(status).toUpperCase()}</span><div class="moduleHead"><strong>${i.name.toUpperCase()}</strong><span>${String(i.description||i.category).toUpperCase()}</span></div><small>${String(i.category).toUpperCase()}</small>`;return el}
MS.ModuleFaceplate=Object.freeze({render,info});
})(window);
