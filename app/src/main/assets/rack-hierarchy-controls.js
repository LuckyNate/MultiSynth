"use strict";
(function(global){
const MS=global.MultiSynth||{},H=MS.HierarchyLibrary,E=MS.RackEngine;
if(!H||!E)return;
const q=new URLSearchParams(location.search),mode=q.get("mode")||"rack",cascadeId=q.get("cascade")||"";
const up=document.getElementById("hierarchyUpBtn"),savedBtn=document.getElementById("addSavedRackBtn"),savedChooser=document.getElementById("savedRackChooser"),savedChoices=document.getElementById("savedRackChoices"),closeSaved=document.getElementById("closeSavedRackChooser"),newRack=document.getElementById("newRackBtn"),grid=document.getElementById("rackGrid");
const PROJECT="multisynth.rack.project.v1";
function cascade(){return cascadeId?H.get("cascade",cascadeId):null}
function members(){return new Set((cascade()?.rackRefs||[]).map(String))}
function nextPosition(){const ids=members(),rs=(E.graph().racks||[]).filter(r=>ids.has(String(r.id)));if(!rs.length)return{row:0,col:0};return{row:Math.max(...rs.map(r=>Number(r.row)||0))+1,col:rs[rs.length-1]?.col||0}}
function setSelected(id){try{const data=JSON.parse(localStorage.getItem(PROJECT)||"null");if(data&&typeof data==="object"){data.meta=Object.assign({},data.meta,{selectedRack:id,workspaceType:"cascade",cascadeId});localStorage.setItem(PROJECT,JSON.stringify(data));}}catch(_){} }
function filterGrid(){if(mode!=="cascade"||!cascadeId)return;const ids=members();grid?.querySelectorAll("[data-rack-id]").forEach(node=>{const cell=node.closest(".rackCell");if(cell)cell.hidden=!ids.has(String(node.dataset.rackId));});document.querySelectorAll(".rackListItem").forEach(item=>{const text=item.textContent||"";const graph=E.graph().racks||[];const r=graph.find(x=>text.includes(`ROW ${x.row} · COL ${x.col}`));if(r)item.hidden=!ids.has(String(r.id));});}
function showSaved(){if(mode!=="cascade"||!cascadeId)return;const used=members();savedChoices.innerHTML="";const racks=H.list("rack").filter(r=>!used.has(String(r.id)));if(!racks.length){const e=document.createElement("div");e.className="empty";e.textContent="NO UNUSED SAVED RACKS";savedChoices.appendChild(e);}for(const r of racks){const b=document.createElement("button");b.type="button";b.className="moduleChoice";b.innerHTML=`<span class="miniStatus">ADD</span><strong>${String(r.name||r.id).toUpperCase()}</strong><span class="miniDesc">SAVED RACK · ${r.id}</span>`;b.onclick=()=>{H.addRack(cascadeId,r.id);savedChooser.classList.add("hidden");setSelected(r.id);location.reload();};savedChoices.appendChild(b);}savedChooser.classList.remove("hidden");}
if(mode==="cascade"&&cascadeId){
 document.querySelector(".topbar h1")&&(document.querySelector(".topbar h1").textContent=(cascade()?.name||"CASCADE").toUpperCase());
 if(savedBtn){savedBtn.hidden=false;savedBtn.addEventListener("click",showSaved)}
 if(up){up.hidden=false;up.textContent="↑ ARRANGEMENTS";up.onclick=()=>location.href=`workspace-library.html?type=arranger&addCascade=${encodeURIComponent(cascadeId)}`;}
 closeSaved&&(closeSaved.onclick=()=>savedChooser.classList.add("hidden"));
 savedChooser?.addEventListener("click",e=>{if(e.target===savedChooser)savedChooser.classList.add("hidden")});
 newRack?.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();const p=nextPosition();try{const id=E.addRack(p.row,p.col);H.registerRack(id);H.addRack(cascadeId,id);setSelected(id);location.reload();}catch(err){global.dispatchEvent(new CustomEvent("multisynth-rack-ui-error",{detail:err.message}))}},true);
 global.addEventListener("multisynth-rack-frontier-rendered",filterGrid);
 E.on?.("graph-changed",filterGrid);
 requestAnimationFrame(filterGrid);
}else if(mode==="rack"){
 const selected=q.get("selected")||"";
 if(up&&selected){up.hidden=false;up.textContent="↑ CASCADES";up.onclick=()=>location.href=`workspace-library.html?type=cascade&addRack=${encodeURIComponent(selected)}`;}
}
})(window);
