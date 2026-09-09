"use strict";
(function(){
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL,host=document.getElementById("controls");if(!instance||!E||!R||!C||!host)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const xy=R.mount(host,{id:"keyless-xy",control:C.XY,label:"PITCH / AMP"},{freewheel:true});
function push(touching){const x=clamp(Number(xy.dataset.x)||0,0,1),y=clamp(Number(xy.dataset.y)||0,0,1),pitch=21+x*87,amp=1-y;try{E.setModuleState(instance,{pitch,amp,touching})}catch(err){console.error(err)}}
xy.addEventListener("pointerdown",()=>{A?.resume?.();push(true)});
xy.addEventListener("pointermove",e=>{if(e.buttons===0&&e.pressure===0)return;push(true)});
xy.addEventListener("pointerup",()=>push(false));
xy.addEventListener("pointercancel",()=>push(false));
xy.addEventListener("lostpointercapture",()=>{try{E.setModuleState(instance,{amp:0,touching:false})}catch(err){console.error(err)}});
})();