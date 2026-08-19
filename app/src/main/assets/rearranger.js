"use strict";
(function(){
const PROJECT="multisynth.rack.project.v1",ARR="multisynth-arrangements-v1",slots=document.getElementById("cascadeSlots"),params=new URLSearchParams(location.search);
const requestedId=params.get("arrangement")||"";
function blank(){return{format:"multisynth-spatial-rack",version:2,meta:{},racks:[]}}
function load(){try{const raw=localStorage.getItem(PROJECT);if(!raw)return blank();const data=JSON.parse(raw);return data?.format==="multisynth-spatial-rack"?data:blank()}catch(_){return blank()}}
function save(data){localStorage.setItem(PROJECT,JSON.stringify(data))}
function loadArr(){try{const d=JSON.parse(localStorage.getItem(ARR)||"null");return d&&Array.isArray(d.arrangements)?d:{version:1,arrangements:[]}}catch(_){return{version:1,arrangements:[]}}}
function saveArr(d){localStorage.setItem(ARR,JSON.stringify(d))}
function current(){const d=loadArr();let a=d.arrangements.find(x=>String(x.id)===String(requestedId));if(!a){a={id:requestedId||`arr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,name:"Arrangement",length:0,children:[]};d.arrangements.push(a);saveArr(d)}a.children=Array.isArray(a.children)?a.children:[];return{d,a}}
function parentsOf(r,racks){return racks.filter(p=>p.enabled!==false&&p.row===r.row-1&&Math.abs(p.col-r.col)<=1)}
function heads(data){const racks=(data.racks||[]).filter(r=>r.enabled!==false);return racks.filter(r=>parentsOf(r,racks).length===0)}
function subtree(head,data){const racks=(data.racks||[]).filter(r=>r.enabled!==false),seen=new Set([head.id]),queue=[head];while(queue.length){const r=queue.shift();for(const c of racks){if(seen.has(c.id))continue;if(c.row===r.row+1&&Math.abs(c.col-r.col)<=1){seen.add(c.id);queue.push(c)}}}return[...seen]}
function cascadeRefs(a){return a.children.filter(c=>c&&c.kind==="cascade"&&c.ref).map(c=>String(c.ref))}
function addCascadeRef(a,id){if(cascadeRefs(a).includes(String(id)))return; a.children.push({id:`slot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,kind:"cascade",ref:String(id),start:0,stop:0})}
function openHead(id){const data=load(),{a}=current();data.meta=Object.assign({},data.meta,{selectedRack:id,returnTo:`rearranger.html?arrangement=${encodeURIComponent(a.id)}`});save(data);location.href=`rackbuilder.html?mode=cascade&selected=${encodeURIComponent(id)}`}
function nextPosition(data){const hs=heads(data);if(!hs.length)return{row:0,col:0};const maxCol=Math.max(...hs.map(r=>r.col));return{row:0,col:maxCol+4}}
function newCascade(){const data=load(),p=nextPosition(data),id=`rack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,cur=current();data.racks=data.racks||[];data.racks.push({id,row:p.row,col:p.col,enabled:true,gain:1,modules:[]});addCascadeRef(cur.a,id);saveArr(cur.d);data.meta=Object.assign({},data.meta,{selectedRack:id,returnTo:`rearranger.html?arrangement=${encodeURIComponent(cur.a.id)}`});save(data);location.href=`rackbuilder.html?mode=cascade&selected=${encodeURIComponent(id)}`}
function render(){const data=load(),allHeads=new Map(heads(data).map(h=>[String(h.id),h])),cur=current(),members=cascadeRefs(cur.a).filter(id=>allHeads.has(id));slots.innerHTML="";members.forEach((id,i)=>{const h=allHeads.get(id),ids=subtree(h,data),mods=(data.racks||[]).filter(r=>ids.includes(r.id)).reduce((n,r)=>n+(r.modules?.length||0),0),b=document.createElement("button");b.type="button";b.className="cascadeSlot";b.innerHTML=`<div><small>CASCADE ${i+1}</small><strong>${h.id}</strong></div><div class="meta">${ids.length} RACK${ids.length===1?"":"S"} · ${mods} COMPONENT${mods===1?"":"S"}</div>`;b.onclick=()=>openHead(h.id);slots.appendChild(b)});const empty=document.createElement("button");empty.type="button";empty.className="cascadeSlot empty";empty.innerHTML="<strong>+</strong><span>NEW CASCADE</span><small>TAP TO BUILD</small>";empty.onclick=newCascade;slots.appendChild(empty)}
render();
})();
