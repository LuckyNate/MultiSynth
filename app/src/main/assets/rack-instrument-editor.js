"use strict";
(async()=>{
const q=new URLSearchParams(location.search),instance=q.get("instance");
let type=q.get("type")||document.documentElement.dataset.moduleType||"",rackId="",state={},keyboard=null;
function ensureStyle(href){if([...document.styleSheets].some(s=>String(s.href||"").endsWith(href)))return;const l=document.createElement("link");l.rel="stylesheet";l.href=href;document.head.appendChild(l)}
function ensureScript(src,test){return new Promise((resolve,reject)=>{if(test())return resolve();const found=[...document.scripts].find(s=>String(s.src||"").endsWith(src));if(found){if(test())return resolve();found.addEventListener("load",()=>test()?resolve():reject(new Error(src+" loaded without required export")),{once:true});found.addEventListener("error",reject,{once:true});return}const s=document.createElement("script");s.src=src;s.onload=()=>test()?resolve():reject(new Error(src+" loaded without required export"));s.onerror=reject;document.head.appendChild(s)})}
function renderFatal(root,message){console.error(message);if(!root)return;const err=document.createElement("div");err.className="moduleBuilderRenderError";err.textContent="MODULE BUILDER ERROR · "+message;root.appendChild(err)}
try{
let P=(parent!==window&&parent.MultiSynth)||window.MultiSynth||{},I=P.ModuleIds,E=P.RackEngine,A=P.RackAudioGraph,B=P.ModuleBuilderDefinitions,C=P.ModuleContract;
let runtime=null;
if(instance&&C)try{runtime=C.getRuntime(instance);type=runtime.type||type;state=runtime.state||{};rackId=runtime.rack?.rackId||""}catch(_){}
if(instance&&E&&!rackId)try{for(const r0 of E.graph?.().racks||[]){const m=r0.modules?.find?.(x=>x.id===instance);if(m){type=m.type;rackId=r0.id;state=m.state||{};break}}}catch(_){}
async function ensureLocalBuilderBase(){
  await ensureScript("module-ids.js",()=>!!window.MultiSynth?.ModuleIds);
  await ensureScript("module-builder-definitions.js",()=>!!window.MultiSynth?.ModuleBuilderDefinitions);
  return{I:window.MultiSynth.ModuleIds,B:window.MultiSynth.ModuleBuilderDefinitions};
}
async function ensureDefinition(){
  if(B?.get?.(type))return;
  const local=await ensureLocalBuilderBase(),LI=local.I,LB=local.B;
  if(!type)type=LI.PURE_SYNTH;
  if(!LB.get(type)){
    await ensureScript("module-contract.js",()=>!!window.MultiSynth?.ModuleContract);
    await ensureScript("dsp-source-family.js",()=>!!window.MultiSynth?.DspSources);
    const sourceFamily=new Set([LI.PURE_SYNTH,LI.QUAD_SYNTH,LI.PULSYNTH,LI.SIN_LADDER,LI.RAZORBACK,LI.STINGER,LI.NO_QUARTER]);
    if(sourceFamily.has(type))await ensureScript("modules/carrier-synth-modules.js",()=>{try{return!!window.MultiSynth?.ModuleContract?.getDefinition(type)}catch(_){return false}});
    await ensureScript(LI.scriptFor(type),()=>!!window.MultiSynth?.ModuleBuilderDefinitions?.get(type));
  }
  I=I||LI;B=LB;
}
if(!I||!B){
  const local=await ensureLocalBuilderBase();I=local.I;B=local.B;
  P=window.MultiSynth||{};E=E||P.RackEngine;A=A||P.RackAudioGraph;C=C||P.ModuleContract;
}
if(!type)type=I?.PURE_SYNTH||"puresynth";
await ensureDefinition();
if(instance&&!runtime&&C)try{runtime=C.getRuntime(instance);type=runtime.type||type;state=runtime.state||state;rackId=runtime.rack?.rackId||rackId}catch(_){}
const root=document.getElementById("controls");
if(!I||!B){renderFatal(root,"AUTHORITATIVE MODULE BUILDER REGISTRY UNAVAILABLE");return}
const def=B.require?.(type)||B.get?.(type);if(!def){renderFatal(root,"MISSING MODULE BUILDER DEFINITION · "+type);return}
if((def.controls||[]).some(c=>c.control==="keyboard"||c.control==="adsr"||c.control==="scope"))await ensureScript("rack-ui-prefabs.js",()=>!!window.RackUIPrefabs);
let U=window.RackUI;if(!U){renderFatal(root,"SHARED CONTROL LIBRARY UNAVAILABLE");return}
const meta=P.ModuleManifest?.get?.(type)||{},title=document.getElementById("title"),desc=document.getElementById("desc"),stepControls=[];
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function selectedLane(){return Math.max(0,Math.round(Number(state.selected??state.selectedSample??0)||0))}
function syncStepControl(slot){
  const lanes=Number(slot.control?.value?.lanes)||1;
  if(lanes<=1)return;
  const grid=slot.rendered,buttons=grid?.querySelectorAll?.(".ruiStep");
  if(!buttons?.length)return;
  const key=slot.control.state||slot.control.id,lane=Math.min(lanes-1,selectedLane()),count=Number(slot.control?.value?.count)||buttons.length;
  let pattern=Array.isArray(state[key])?clone(state[key]):[];
  while(pattern.length<lanes)pattern.push(Array(count).fill(0));
  while(pattern[lane].length<count)pattern[lane].push(0);
  buttons.forEach((button,i)=>{
    button.classList.toggle("active",!!pattern[lane]?.[i]);
    button.setAttribute("aria-pressed",pattern[lane]?.[i]?"true":"false");
    button.onclick=()=>{
      const next=Array.isArray(state[key])?clone(state[key]):clone(pattern);
      while(next.length<lanes)next.push(Array(count).fill(0));
      while(next[lane].length<count)next[lane].push(0);
      next[lane][i]=next[lane][i]?0:1;
      patch({[key]:next});
      syncStepControl(slot);
    };
  });
}
function refreshStepControls(){for(const slot of stepControls)try{syncStepControl(slot)}catch(e){console.error("Step control refresh failed",e)}}
function patch(p){state={...state,...p};if(instance)try{if(rackId&&E)E.setModuleState(rackId,instance,p);else if(C)state=C.update(instance,p)}catch(e){console.error(e)}if(Object.prototype.hasOwnProperty.call(p,"selected")||Object.keys(p).some(k=>stepControls.some(s=>(s.control.state||s.control.id)===k)))refreshStepControls()}
function resolved(c){const dyn=c.meta?.dynamicState,key=dyn?.[state.waveform];return key?{...c,state:key}:c}
function groupName(c){if(c.meta?.group)return String(c.meta.group);const m=String(c.id||"").match(/(\d+)$/);if(m&&+m[1]>=1&&+m[1]<=3)return "STAGE "+m[1];return "MASTER"}
const groups=new Map();function sectionFor(c){const name=groupName(c);if(groups.has(name))return groups.get(name);const sec=document.createElement("section");sec.className="group "+name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const h=document.createElement("h2");h.textContent=name;sec.appendChild(h);root.appendChild(sec);groups.set(name,sec);return sec}
document.documentElement.style.setProperty("--accent",def.faceplate?.secondary||meta.color||"#f4f4f0");title.textContent=(meta.displayName||I.displayNameFor?.(type)||type).toUpperCase();desc.textContent=String(meta.description||def.package?.behavior?.role||"MODULE").toUpperCase();
async function renderAll(){if((def.controls||[]).some(c=>c.control==="keyboard")){ensureStyle("control-performance-keyboard.css");ensureStyle("control-surface.css");await ensureScript("control-performance-keyboard.js",()=>!!window.MultiSynth?.PerformanceKeyboard)}for(const raw of def.controls||[]){const c=resolved(raw);try{const placement=c.meta?.pinned||c.meta?.displayOnly?root:sectionFor(c);const rendered=U.renderControl(placement,c,{state,defaults:def.defaults||{},patch,audio:A});if(c.control==="steps"){const slot={control:c,rendered};stepControls.push(slot);syncStepControl(slot)}if(c.control==="keyboard"){keyboard=rendered||keyboard;if(c.meta?.pinned==="bottom")document.body.classList.add("hasPinnedKeyboard")}}catch(e){console.error(e);const err=document.createElement("div");err.className="moduleBuilderRenderError";err.textContent=`MODULE BUILDER ERROR · ${c.id||"unnamed"} · ${e.message}`;root.appendChild(err)}}}
await renderAll();
const cleanup=()=>{try{keyboard?.destroy?.()}catch(_){}};window.addEventListener("pagehide",cleanup,{once:true});window.addEventListener("beforeunload",cleanup,{once:true});
}catch(e){renderFatal(document.getElementById("controls"),e?.message||String(e))}
})();