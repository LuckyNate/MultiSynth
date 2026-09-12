"use strict";
(()=>{
const anchor=document.getElementById("ribbonScope");if(!anchor)return;
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},C=P.ModuleContract,MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,CS=MS.ControlSurface?.CONTROL;
if(!R||!CS)return;
const host=document.createElement("div"),scope=R.mount(host,{id:"ribbonScope",control:CS.OSCILLOSCOPE,meta:{trace:[]}});
host.style.cssText="position:relative;width:100%;height:100%";scope.style.cssText+=";position:absolute;inset:0;width:100%;height:100%;max-width:none;transform:none";const face=scope.querySelector(".ms-control-face");if(face){face.style.width="100%";face.style.height="100%"}
anchor.replaceWith(host);
const binding={trace:[]};R.bindOscilloscope(scope,binding);
let analyser=null,data=null,dead=false;
function getAnalyser(){if(analyser)return analyser;try{analyser=C?.getRuntime?.(instance)?.user?.analyser||null}catch(_){}if(analyser)data=new Float32Array(analyser.fftSize);return analyser}
function draw(){if(dead)return;const a=getAnalyser();if(a){if(!data||data.length!==a.fftSize)data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);binding.trace=data;scope.commitOscilloscopeTrace?.(data)}else scope.commitOscilloscopeTrace?.([]);requestAnimationFrame(draw)}
requestAnimationFrame(draw);addEventListener("pagehide",()=>{dead=true});
})();
