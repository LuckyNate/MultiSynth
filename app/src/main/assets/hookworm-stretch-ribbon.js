"use strict";
(()=>{
const q=new URLSearchParams(location.search),rackId=q.get("rack"),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.RackEngine,R=window.MultiSynth?.ControlSurfaceRenderer,F=window.MultiSynth?.ControlTouchFollower;if(!rackId||!instance||!E||!R)return;
let rack,module;try{rack=E.getRack(rackId);module=rack.modules.find(m=>m.id===instance)}catch(_){}if(!module)return;
let value=Math.max(0,Math.min(1,Number(module.state?.stretchBlend??.5)));
const host=document.getElementById("controls");if(!host)return;
const section=document.createElement("section");section.className="group";const h=document.createElement("h2");h.textContent="TIME STRETCH METHOD";section.appendChild(h);
const labels=document.createElement("div");labels.style.cssText="display:flex;justify-content:space-between;width:220px;max-width:100%;margin:0 auto 6px;font-weight:800;font-size:11px;letter-spacing:.05em";labels.innerHTML="<span>PITCH</span><span>HYBRID</span><span>TILE</span>";section.appendChild(labels);
const ribbon=R.render({control:"ribbon",id:"stretchBlend",state:"stretchBlend",label:"PITCH STRETCH ← HYBRID → TILE",value:{default:.5,min:0,max:1,step:.01}});section.appendChild(ribbon);host.appendChild(section);
const marker=ribbon.querySelector(".ms-ribbon-position"),face=ribbon.querySelector(".ms-control-face"),out=ribbon.querySelector(".ms-control-value");
function paint(){const pct=value*100;if(marker)marker.style.left=pct+"%";if(out)out.value=out.textContent=(pct<1?"PITCH":pct>99?"TILE":Math.round(pct)+"% TILE")}
function patch(v){value=Math.max(0,Math.min(1,v));paint();try{E.setModuleState(rackId,instance,{stretchBlend:value});P.RackAudioGraph?.rebuild?.()}catch(e){console.error(e)}}
function fromPoint(e){const r=face.getBoundingClientRect();patch((e.clientX-r.left)/Math.max(1,r.width));F?.move?.(ribbon,Math.round(value*100)+"% TILE",e)}
let pid=null;face.addEventListener("pointerdown",e=>{e.preventDefault();pid=e.pointerId;try{face.setPointerCapture(pid)}catch(_){}fromPoint(e);F?.show?.(ribbon,Math.round(value*100)+"% TILE",e)});face.addEventListener("pointermove",e=>{if(e.pointerId===pid)fromPoint(e)});const end=e=>{if(pid==null||e.pointerId!==pid)return;pid=null;F?.hide?.(ribbon)};face.addEventListener("pointerup",end);face.addEventListener("pointercancel",end);face.addEventListener("lostpointercapture",()=>{pid=null;F?.hide?.(ribbon)});paint();
})();
