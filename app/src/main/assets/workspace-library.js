"use strict";
(function(){
const params=new URLSearchParams(location.search),type=["rack","cascade","arranger"].includes(params.get("type"))?params.get("type"):"rack";
const H=window.MultiSynth?.HierarchyLibrary,PROJECT="multisynth.rack.project.v1";
const title=document.getElementById("title"),items=document.getElementById("items"),nav=document.getElementById("hierarchyNav");
const labels={rack:"RACKS",cascade:"CASCADES",arranger:"ARRANGEMENTS"};title.textContent=labels[type];
function blankProject(){return{format:"multisynth-spatial-rack",version:2,meta:{},racks:[]}}
function loadProject(){try{const d=JSON.parse(localStorage.getItem(PROJECT)||"null");return d?.format==="multisynth-spatial-rack"?d:blankProject()}catch(_){return blankProject()}}
function saveProject(d){localStorage.setItem(PROJECT,JSON.stringify(d))}
const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
function renderNav(){if(!nav)return;nav.innerHTML=`<a href="workspace-library.html?type=rack" class="${type==="rack"?"active":""}">↓ RACKS</a><a href="workspace-library.html?type=cascade" class="${type==="cascade"?"active":""}">↕ CASCADES</a><a href="workspace-library.html?type=arranger" class="${type==="arranger"?"active":""}">↑ ARRANGEMENTS</a>`}
function entries(){if(!H)return[];return H.list(type==="arranger"?"arrangement":type)}
function openEntry(e){if(type==="rack"){const p=loadProject();p.meta=Object.assign({},p.meta,{selectedRack:e.id,returnTo:"workspace-library.html?type=rack",workspaceType:"rack"});saveProject(p);location.href=`rackbuilder.html?mode=rack&selected=${encodeURIComponent(e.id)}`;return;}if(type==="cascade"){location.href=`rackbuilder.html?mode=cascade&cascade=${encodeURIComponent(e.id)}`;return;}location.href=`rearranger.html?arrangement=${encodeURIComponent(e.id)}`;}
function createRack(){const p=loadProject(),id=uid("rack");let maxCol=-4;for(const r of p.racks||[])if(Number.isFinite(Number(r.col)))maxCol=Math.max(maxCol,Number(r.col));p.racks=p.racks||[];p.racks.push({id,row:0,col:maxCol+4,enabled:true,gain:1,modules:[]});H?.registerRack(id,`Rack ${H.list("rack").length+1}`);p.meta=Object.assign({},p.meta,{selectedRack:id,returnTo:"workspace-library.html?type=rack",workspaceType:"rack",newRack:true});saveProject(p);location.href=`rackbuilder.html?mode=rack&selected=${encodeURIComponent(id)}&new=1`;}
function createCascade(){const c=H.createCascade();location.href=`rackbuilder.html?mode=cascade&cascade=${encodeURIComponent(c.id)}`;}
function createArrangement(){const a=H.createArrangement();location.href=`rearranger.html?arrangement=${encodeURIComponent(a.id)}`;}
function createEntry(){type==="rack"?createRack():type==="cascade"?createCascade():createArrangement()}
function render(){renderNav();items.innerHTML="";const list=entries();if(!list.length){const e=document.createElement("div");e.className="empty";e.textContent=`No saved ${labels[type].toLowerCase()} yet.`;items.appendChild(e)}for(const e of list){const b=document.createElement("button");b.type="button";b.className="item";const detail=type==="cascade"?`${(e.rackRefs||[]).length} RACK${(e.rackRefs||[]).length===1?"":"S"}`:type==="arranger"?`${(e.children||[]).length} CHILD${(e.children||[]).length===1?"":"REN"}`:e.id;b.innerHTML=`<div><strong>${e.name||e.id}</strong><small>${detail}</small></div><span class="arrow">›</span>`;b.onclick=()=>openEntry(e);items.appendChild(b)}const n=document.createElement("button");n.type="button";n.className="item new";n.innerHTML=`<div><strong>+</strong><small>NEW ${type==="arranger"?"ARRANGEMENT":type.toUpperCase()}</small></div>`;n.onclick=createEntry;items.appendChild(n)}
render();
})();