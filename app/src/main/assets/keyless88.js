"use strict";
(function(){
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,surface=document.getElementById("keyless-surface"),cross=document.getElementById("keyless-crosshair"),readout=document.getElementById("keyless-readout");if(!instance||!E||!surface)return;
let active=false,pointer=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const names=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
function label(m){const nearest=Math.round(m),name=names[((nearest%12)+12)%12]+(Math.floor(nearest/12)-1),hz=440*Math.pow(2,(m-69)/12);return `${name} · ${hz.toFixed(hz<100?2:1)} Hz`}
function update(e,touching=true){const r=surface.getBoundingClientRect(),x=clamp((e.clientX-r.left)/Math.max(1,r.width),0,1),y=clamp((e.clientY-r.top)/Math.max(1,r.height),0,1),pitch=21+x*87,amp=1-y;if(cross){cross.style.left=`${x*100}%`;cross.style.top=`${y*100}%`}if(readout)readout.textContent=label(pitch);surface.dataset.active=touching?"1":"0";try{E.setModuleState(instance,{pitch,amp,touching})}catch(err){console.error(err)}}
surface.addEventListener("pointerdown",e=>{A?.resume?.();active=true;pointer=e.pointerId;surface.setPointerCapture?.(pointer);update(e,true);e.preventDefault()});
surface.addEventListener("pointermove",e=>{if(!active||e.pointerId!==pointer)return;update(e,true);e.preventDefault()});
function end(e){if(!active||e.pointerId!==pointer)return;update(e,false);active=false;try{surface.releasePointerCapture?.(pointer)}catch(_){}pointer=null;e.preventDefault()}
surface.addEventListener("pointerup",end);surface.addEventListener("pointercancel",end);surface.addEventListener("lostpointercapture",()=>{if(!active)return;active=false;surface.dataset.active="0";try{E.setModuleState(instance,{amp:0,touching:false})}catch(err){console.error(err)}});
})();