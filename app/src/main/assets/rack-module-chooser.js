"use strict";
(function(global){
const MS=global.MultiSynth||{},M=MS.ModuleManifest,C=MS.ModuleContract,E=MS.RackEngine,B=MS.RackBuilder,A=MS.RackAudioGraph;
const button=document.getElementById("addModuleBtn"),chooser=document.getElementById("moduleChooser"),choices=document.getElementById("moduleChoices"),close=document.getElementById("closeModuleChooser"),toast=document.getElementById("toast");
if(!button||!chooser||!choices||!M||!C||!E||!B)return;
const hide=()=>chooser.classList.add("hidden");
const flash=msg=>{if(!toast)return;toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)};
function registered(meta){try{return{meta,def:C.getDefinition(meta.id)}}catch(_){return null}}
function show(){const rackId=B.state?.selectedRack;if(!rackId)return;const rows=M.all.map(registered).filter(Boolean).sort((a,b)=>a.meta.displayName.localeCompare(b.meta.displayName));choices.innerHTML="";for(const row of rows){const m=row.meta,d=row.def,b=document.createElement("button");b.type="button";b.className=`moduleChoice synthMini ${m.themeKey||d.selectorClass||""}`.trim();b.innerHTML=`<span class="miniStatus">ADD</span><strong>${m.displayName.toUpperCase()}</strong><span class="miniDesc">${d.description||(m.category||d.category||"MODULE").toUpperCase()}</span>`;if(m.color)b.style.setProperty("--module-color",m.color);b.onclick=()=>{try{const type=d.type;if(!type)throw new Error("Registered module has no canonical type");E.addModule(rackId,type);A?.rebuild?.();hide();flash(`${m.displayName.toUpperCase()} ADDED`)}catch(err){console.error("Rack component chooser",err);flash(err?.message||"COULD NOT ADD COMPONENT")}};choices.appendChild(b)}chooser.classList.remove("hidden")}
button.onclick=show;if(close)close.onclick=hide;chooser.addEventListener("click",e=>{if(e.target===chooser)hide()});
MS.RackModuleChooser=Object.freeze({show,hide});
})(window);
