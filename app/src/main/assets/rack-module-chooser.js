"use strict";
(function(global){
const MS=global.MultiSynth||{},M=MS.ModuleManifest,C=MS.ModuleContract,E=MS.RackEngine,B=MS.RackBuilder,A=MS.RackAudioGraph;
const button=document.getElementById("addModuleBtn"),chooser=document.getElementById("moduleChooser"),choices=document.getElementById("moduleChoices"),close=document.getElementById("closeModuleChooser");
if(!button||!chooser||!choices||!M||!C||!E||!B)return;
const hide=()=>chooser.classList.add("hidden");
function registered(meta){try{return{meta,def:C.getDefinition(meta.id)}}catch(_){return null}}
function show(){const rackId=B.state?.selectedRack;if(!rackId)return;const rows=M.all.map(registered).filter(Boolean).sort((a,b)=>a.meta.displayName.localeCompare(b.meta.displayName));choices.innerHTML="";for(const row of rows){const m=row.meta,d=row.def,b=document.createElement("button");b.type="button";b.className=`moduleChoice synthMini ${m.themeKey||d.selectorClass||""}`.trim();b.innerHTML=`<span class="miniStatus">ADD</span><strong>${m.displayName.toUpperCase()}</strong><span class="miniDesc">${d.description||(m.category||d.category||"MODULE").toUpperCase()}</span>`;if(m.color)b.style.setProperty("--module-color",m.color);b.onclick=()=>{try{E.addModule(rackId,m.id);A?.rebuild?.();hide()}catch(err){console.error("Rack component chooser",err)}};choices.appendChild(b)}chooser.classList.remove("hidden")}
button.onclick=show;if(close)close.onclick=hide;chooser.addEventListener("click",e=>{if(e.target===chooser)hide()});
MS.RackModuleChooser=Object.freeze({show,hide});
})(window);
