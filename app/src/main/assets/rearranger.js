"use strict";
(function(){
const STORAGE="multisynth.rack.project.v1",MEMBERS="multisynth.rearranger.members.v1",slots=document.getElementById("cascadeSlots");
function blank(){return{format:"multisynth-spatial-rack",version:2,meta:{},racks:[]}}
function load(){try{const raw=localStorage.getItem(STORAGE);if(!raw)return blank();const data=JSON.parse(raw);return data?.format==="multisynth-spatial-rack"?data:blank()}catch(_){return blank()}}
function save(data){localStorage.setItem(STORAGE,JSON.stringify(data))}
function loadMembers(){try{const v=JSON.parse(localStorage.getItem(MEMBERS)||"[]");return Array.isArray(v)?v.map(String):[]}catch(_){return[]}}
function saveMembers(ids){localStorage.setItem(MEMBERS,JSON.stringify([...new Set(ids.map(String))]))}
function parentsOf(r,racks){return racks.filter(p=>p.enabled!==false&&p.row===r.row-1&&Math.abs(p.col-r.col)<=1)}
function heads(data){const racks=(data.racks||[]).filter(r=>r.enabled!==false);return racks.filter(r=>parentsOf(r,racks).length===0)}
function subtree(head,data){const racks=(data.racks||[]).filter(r=>r.enabled!==false),seen=new Set([head.id]),queue=[head];while(queue.length){const r=queue.shift();for(const c of racks){if(seen.has(c.id))continue;if(c.row===r.row+1&&Math.abs(c.col-r.col)<=1){seen.add(c.id);queue.push(c)}}}return[...seen]}
function openHead(id){const data=load();data.meta=Object.assign({},data.meta,{selectedRack:id,returnTo:"rearranger.html"});save(data);location.href="rackbuilder.html"}
function nextPosition(data){const hs=heads(data);if(!hs.length)return{row:0,col:0};const maxCol=Math.max(...hs.map(r=>r.col));return{row:0,col:maxCol+4}}
function newCascade(){const data=load(),p=nextPosition(data),id=`rack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;data.racks=data.racks||[];data.racks.push({id,row:p.row,col:p.col,enabled:true,gain:1,modules:[]});saveMembers([...loadMembers(),id]);data.meta=Object.assign({},data.meta,{selectedRack:id,returnTo:"rearranger.html"});save(data);location.href="rackbuilder.html"}
function render(){const data=load(),allHeads=new Map(heads(data).map(h=>[String(h.id),h])),members=loadMembers().filter(id=>allHeads.has(id));if(members.length!==loadMembers().length)saveMembers(members);slots.innerHTML="";members.forEach((id,i)=>{const h=allHeads.get(id),ids=subtree(h,data),mods=(data.racks||[]).filter(r=>ids.includes(r.id)).reduce((n,r)=>n+(r.modules?.length||0),0),b=document.createElement("button");b.type="button";b.className="cascadeSlot";b.innerHTML=`<div><small>CASCADE ${i+1}</small><strong>${h.id}</strong></div><div class="meta">${ids.length} RACK${ids.length===1?"":"S"} · ${mods} COMPONENT${mods===1?"":"S"}</div>`;b.onclick=()=>openHead(h.id);slots.appendChild(b)});const empty=document.createElement("button");empty.type="button";empty.className="cascadeSlot empty";empty.innerHTML="<strong>+</strong><span>NEW CASCADE</span><small>TAP TO BUILD</small>";empty.onclick=newCascade;slots.appendChild(empty)}
render();
})();
