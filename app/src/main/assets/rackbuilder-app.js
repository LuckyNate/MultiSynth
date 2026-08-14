"use strict";
(function(global){
const E=global.MultiSynth.RackEngine,B=global.MultiSynth.RackBuilder;
const grid=document.getElementById("rackGrid"),rackList=document.getElementById("rackList"),cascadePanel=document.getElementById("cascadePanel"),cascadeList=document.getElementById("cascadeList"),cascadeTitle=document.getElementById("cascadeTitle"),neighborhoodText=document.getElementById("neighborhoodText"),toast=document.getElementById("toast");
let selected=null;
const ROWS=12,COLS=9;

["placeholder","gain","meter"].forEach(type=>E.defineModule({type,kind:"utility",defaults:{}}));

function rackName(r){return `RACK ${r.row+1}.${r.col+1}`;}
function flash(msg){toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1200);}
function buildGrid(){grid.innerHTML="";for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const cell=document.createElement("div");cell.className="rackCell";cell.dataset.rackRow=r;cell.dataset.rackCol=c;cell.dataset.label=`${r},${c}`;grid.appendChild(cell);}render();}
function render(){const graph=E.graph();grid.querySelectorAll(".rackNode").forEach(n=>n.remove());for(const r of graph.racks){const cell=[...grid.children].find(x=>+x.dataset.rackRow===r.row&&+x.dataset.rackCol===r.col);if(!cell)continue;const node=document.createElement("div");node.className="rackNode"+(r.id===selected?" selected":"");node.dataset.rackId=r.id;node.innerHTML=`<strong>${rackName(r)}</strong><span>${r.modules.length} COMPONENT${r.modules.length===1?"":"S"}</span>`;cell.appendChild(node);}applyNeighborhoodClasses();renderRackList();if(selected)renderCascade();}
function applyNeighborhoodClasses(){grid.querySelectorAll(".rackNode").forEach(n=>n.classList.remove("rack-parent","rack-sibling","rack-child"));if(!selected)return;for(const [id,cls] of B.neighborhoodClasses(selected)){grid.querySelector(`[data-rack-id="${CSS.escape(id)}"]`)?.classList.add(cls);}}
function renderRackList(){rackList.innerHTML="";const racks=E.graph().racks.sort((a,b)=>a.row-b.row||a.col-b.col);if(!racks.length){rackList.innerHTML='<div class="rackListItem"><span>Tap any empty grid cell to create the first rack.</span></div>';return;}for(const r of racks){const item=document.createElement("button");item.type="button";item.className="rackListItem"+(r.id===selected?" selected":"");item.innerHTML=`<strong>${rackName(r)}</strong><span>ROW ${r.row} · COL ${r.col} · ${r.modules.length} COMPONENTS</span>`;item.onclick=()=>openRack(r.id);rackList.appendChild(item);}}
function openRack(id){selected=id;B.state.selectedRack=id;cascadePanel.classList.remove("hidden");render();cascadePanel.scrollIntoView({behavior:"smooth",block:"nearest"});}
function createRack(row,col){try{const id=E.addRack(row,col);E.addModule(id,"placeholder",{label:"EMPTY CASCADE"});openRack(id);}catch(err){flash(err.message);}}
function renderCascade(){if(!selected)return;let r;try{r=E.getRack(selected);}catch(_){selected=null;cascadePanel.classList.add("hidden");return;}cascadeTitle.textContent=rackName(r);const n=E.neighborhood(selected);neighborhoodText.textContent=`PARENTS ${n.parents.length}/3 · SIBLINGS ${n.siblings.length}/2 · CHILDREN ${n.children.length}/3`;cascadeList.innerHTML="";for(const m of r.modules){const card=document.createElement("div");card.className="moduleCard";card.dataset.moduleId=m.id;card.innerHTML=`<strong>${(m.state?.label||m.type).toUpperCase()}</strong><span>${m.type} · INSTANCE ${m.id.slice(-5)}</span>`;cascadeList.appendChild(card);}B.bindCascade(cascadeList,selected,{onOpenModule:(_,mid)=>flash(`COMPONENT ${mid.slice(-5)} — controls come in step 2`)});}

B.bindGrid(grid,{onOpenRack:openRack,onEmptyCell:createRack,onPreview:()=>{}});
E.on("graph-changed",render);
window.addEventListener("multisynth-rack-ui-error",e=>flash(e.detail));
document.getElementById("closeCascade").onclick=()=>{selected=null;B.state.selectedRack=null;cascadePanel.classList.add("hidden");render();};
document.getElementById("newRackBtn").onclick=()=>{for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(!E.rackAt(r,c)){createRack(r,c);return;}flash("GRID FULL");};
document.getElementById("addModuleBtn").onclick=()=>{if(!selected)return;E.addModule(selected,"placeholder",{label:"NEW COMPONENT"});render();};

buildGrid();
})(window);
