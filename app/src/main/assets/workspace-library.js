"use strict";
(function(){
const params=new URLSearchParams(location.search),type=["rack","cascade","arranger"].includes(params.get("type"))?params.get("type"):"rack";
const PROJECT="multisynth.rack.project.v1",CATALOG="multisynth.library.v1",ARR="multisynth-arrangements-v1";
const title=document.getElementById("title"),items=document.getElementById("items");
const labels={rack:"RACKS",cascade:"CASCADES",arranger:"ARRANGERS"};title.textContent=labels[type];
function blankProject(){return{format:"multisynth-spatial-rack",version:2,meta:{},racks:[]}}
function loadProject(){try{const d=JSON.parse(localStorage.getItem(PROJECT)||"null");return d?.format==="multisynth-spatial-rack"?d:blankProject()}catch(_){return blankProject()}}
function saveProject(d){localStorage.setItem(PROJECT,JSON.stringify(d))}
function loadCatalog(){try{const d=JSON.parse(localStorage.getItem(CATALOG)||"null");return d&&typeof d==="object"?d:{version:1,racks:[],cascades:[]}}catch(_){return{version:1,racks:[],cascades:[]}}}
function saveCatalog(d){localStorage.setItem(CATALOG,JSON.stringify(d))}
function loadArr(){try{const d=JSON.parse(localStorage.getItem(ARR)||"null");return d&&Array.isArray(d.arrangements)?d:{version:1,arrangements:[]}}catch(_){return{version:1,arrangements:[]}}}
function saveArr(d){localStorage.setItem(ARR,JSON.stringify(d))}
const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
function graphEntryName(kind,index){return `${kind==="rack"?"Rack":"Cascade"} ${index+1}`}
function entries(){if(type==="arranger")return loadArr().arrangements.map(a=>({id:String(a.id),name:a.name||"Arrangement"}));const c=loadCatalog(),key=type==="rack"?"racks":"cascades";return (c[key]||[]).map(x=>({id:String(x.id),name:x.name||x.id}));}
function openEntry(e){if(type==="arranger"){location.href=`rearranger.html?arrangement=${encodeURIComponent(e.id)}`;return;}const p=loadProject();p.meta=Object.assign({},p.meta,{selectedRack:e.id,returnTo:`workspace-library.html?type=${type}`,workspaceType:type});saveProject(p);location.href=`rackbuilder.html?mode=${type}&selected=${encodeURIComponent(e.id)}`;}
function createGraphEntry(){const p=loadProject(),c=loadCatalog(),key=type==="rack"?"racks":"cascades",id=uid("rack"),existing=(c[key]||[]),name=graphEntryName(type,existing.length);let maxCol=-4;for(const r of p.racks||[])if(Number.isFinite(Number(r.col)))maxCol=Math.max(maxCol,Number(r.col));p.racks=p.racks||[];p.racks.push({id,row:0,col:maxCol+4,enabled:true,gain:1,modules:[]});c[key]=[...existing,{id,name}];p.meta=Object.assign({},p.meta,{selectedRack:id,returnTo:`workspace-library.html?type=${type}`,workspaceType:type});saveCatalog(c);saveProject(p);openEntry({id,name});}
function createArranger(){const d=loadArr(),id=uid("arr"),name=`Arrangement ${d.arrangements.length+1}`;d.arrangements.push({id,name,length:0,children:[]});saveArr(d);location.href=`rearranger.html?arrangement=${encodeURIComponent(id)}`;}
function render(){items.innerHTML="";const list=entries();if(!list.length){const e=document.createElement("div");e.className="empty";e.textContent=`No saved ${labels[type].toLowerCase()} yet.`;items.appendChild(e)}for(const e of list){const b=document.createElement("button");b.type="button";b.className="item";b.innerHTML=`<div><strong>${e.name}</strong><small>${e.id}</small></div><span class="arrow">›</span>`;b.onclick=()=>openEntry(e);items.appendChild(b)}const n=document.createElement("button");n.type="button";n.className="item new";n.innerHTML=`<div><strong>+</strong><small>NEW ${type.toUpperCase()}</small></div>`;n.onclick=type==="arranger"?createArranger:createGraphEntry;items.appendChild(n)}
render();
})();