"use strict";
(()=>{
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},I=P.ModuleIds,E=P.RackEngine,A=P.RackAudioGraph,B=P.ModuleBuilderDefinitions,U=window.RackUI;
let type=q.get("type")||document.documentElement.dataset.moduleType||"",rackId="",state={};
if(instance)try{for(const r0 of E?.graph?.().racks||[]){const m=r0.modules?.find?.(x=>x.id===instance);if(m){type=m.type;rackId=r0.id;state=m.state||{};break}}}catch(_){}
if(!I||!B||!U)return;if(!type)type=I.PURE_SYNTH;
const def=B?.require?.(type)||B?.get?.(type);if(!def)throw new Error("Missing Module Builder definition: "+type);
const meta=P.ModuleManifest?.get?.(type)||{},title=document.getElementById("title"),desc=document.getElementById("desc"),root=document.getElementById("controls");
function patch(p){state={...state,...p};if(rackId&&instance)try{E.setModuleState(rackId,instance,p)}catch(e){console.error(e)}}
function groupName(c){if(c.meta?.group)return String(c.meta.group);const m=String(c.id||"").match(/(\d+)$/);if(m&&+m[1]>=1&&+m[1]<=3)return "STAGE "+m[1];return "MASTER"}
const groups=new Map();function sectionFor(c){const name=groupName(c);if(groups.has(name))return groups.get(name);const sec=document.createElement("section");sec.className="group "+name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const h=document.createElement("h2");h.textContent=name;sec.appendChild(h);root.appendChild(sec);groups.set(name,sec);return sec}
document.documentElement.style.setProperty("--accent",def.faceplate?.secondary||meta.color||"#f4f4f0");title.textContent=(meta.displayName||type).toUpperCase();desc.textContent=String(meta.description||def.package?.behavior?.role||"MODULE").toUpperCase();
let keyboard=null;
for(const c of def.controls||[]){try{const placement=c.meta?.pinned||c.meta?.displayOnly?root:sectionFor(c);const rendered=U.renderControl(placement,c,{state,defaults:def.defaults||{},patch,audio:A});if(c.control==="keyboard"){keyboard=rendered||keyboard;if(c.meta?.pinned==="bottom")document.body.classList.add("hasPinnedKeyboard")}}catch(e){console.error(e);const err=document.createElement("div");err.className="moduleBuilderRenderError";err.textContent=`MODULE BUILDER ERROR · ${c.id||"unnamed"} · ${e.message}`;root.appendChild(err)}}
const cleanup=()=>{try{keyboard?.destroy?.()}catch(_){}};window.addEventListener("pagehide",cleanup,{once:true});window.addEventListener("beforeunload",cleanup,{once:true});
})();