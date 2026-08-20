"use strict";
(function(){
const R=window.MultiSynth?.RackLibrary,PROJECT="multisynth.rack.project.v1",items=document.getElementById("items");
function blankProject(){return{format:"multisynth-node-graph",version:4,routing:"explicit-nodes",meta:{},racks:[],connections:[]}}
function loadProject(){try{const d=JSON.parse(localStorage.getItem(PROJECT)||"null");return d&&Array.isArray(d.racks)?d:blankProject()}catch(_){return blankProject()}}
function saveProject(d){d.format="multisynth-node-graph";d.version=4;d.routing="explicit-nodes";localStorage.setItem(PROJECT,JSON.stringify(d))}
const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
function openRack(id){const p=loadProject();p.meta=Object.assign({},p.meta,{selectedRack:id,workspaceType:"rack",routing:"explicit-nodes"});saveProject(p);location.href=`rackbuilder.html?selected=${encodeURIComponent(id)}`}
function createRack(){const p=loadProject(),id=uid("rack");p.racks=p.racks||[];let col=900000;const used=new Set(p.racks.map(r=>`${r.row}:${r.col}`));while(used.has(`900000:${col}`))col++;p.racks.push({id,row:900000,col,enabled:true,gain:1,modules:[]});p.connections=p.connections||[];p.meta=Object.assign({},p.meta,{selectedRack:id,workspaceType:"rack",routing:"explicit-nodes"});saveProject(p);R?.registerRack?.(id,`Rack ${(R?.list?.()||[]).length+1}`);openRack(id)}
function render(){items.innerHTML="";const p=loadProject(),named=R?.list?.()||[];for(const r of p.racks||[]){if(String(r.id).startsWith("nodehost-"))continue;const info=named.find(x=>String(x.id)===String(r.id)),b=document.createElement("button");b.type="button";b.className="item";b.innerHTML=`<div><strong>${(info?.name||`Rack ${String(r.id).slice(-6).toUpperCase()}`)}</strong><small>${(r.modules||[]).length} MODULE${(r.modules||[]).length===1?"":"S"} · NODE GRAPH READY</small></div><span class="arrow">EDIT ›</span>`;b.onclick=()=>openRack(r.id);items.appendChild(b)}const n=document.createElement("button");n.type="button";n.className="item new";n.innerHTML='<div><strong>+</strong><small>NEW EMPTY RACK</small></div>';n.onclick=createRack;items.appendChild(n)}
render();
})();