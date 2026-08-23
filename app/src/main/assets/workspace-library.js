"use strict";
(function(){
const MS=window.MultiSynth||{},F=MS.RackFaceplate,PROJECT="multisynth.rack.project.v1",items=document.getElementById("items");
function blankProject(){return{format:"multisynth-node-graph",version:4,routing:"explicit-nodes",meta:{},racks:[],connections:[]}}
function loadProject(){try{const d=JSON.parse(localStorage.getItem(PROJECT)||"null");return d&&Array.isArray(d.racks)?d:blankProject()}catch(_){return blankProject()}}
function saveProject(d){d.format="multisynth-node-graph";d.version=4;d.routing="explicit-nodes";localStorage.setItem(PROJECT,JSON.stringify(d))}
const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,isDefinition=r=>!String(r.id).startsWith("nodehost-")&&!String(r.id).startsWith("nodeinst-");
function openRack(id){const p=loadProject();p.meta=Object.assign({},p.meta,{selectedRack:id,workspaceType:"rack",routing:"explicit-nodes"});saveProject(p);location.href=`rackbuilder.html?selected=${encodeURIComponent(id)}`}
function createRack(){const p=loadProject(),id=uid("rack");p.racks=p.racks||[];let col=900000;const used=new Set(p.racks.map(r=>`${r.row}:${r.col}`));while(used.has(`900000:${col}`))col++;p.racks.push({id,name:"",row:900000,col,enabled:true,gain:1,modules:[]});p.connections=p.connections||[];p.meta=Object.assign({},p.meta,{selectedRack:id,workspaceType:"rack",routing:"explicit-nodes"});saveProject(p);openRack(id)}
function rackRow(r){const b=document.createElement("button");b.type="button";b.className="rackLibraryRow";const displayName=String(r.name||r.id),face=F?.render?.(r,{name:displayName,selector:true});if(face)b.appendChild(face);b.onclick=()=>openRack(r.id);return b}
function render(){items.innerHTML="";const p=loadProject();for(const r of p.racks||[]){if(!isDefinition(r))continue;items.appendChild(rackRow(r))}const n=document.createElement("button");n.type="button";n.className="rackLibraryRow new";n.innerHTML='<div><strong>+ NEW EMPTY RACK</strong><small>CREATE A NEW RACK</small></div>';n.onclick=createRack;items.appendChild(n)}
render();
})();