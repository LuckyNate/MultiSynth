"use strict";
(function(){
const q=new URLSearchParams(location.search),instance=q.get("instance"),anchor=document.getElementById("moduleScope"),shell=document.getElementById("scopeShell")||anchor?.closest?.(".scopeShell");
if(!anchor||!instance)return;
const P=parent.MultiSynth||{},I=P.ModuleIds,C=P.ModuleContract,A=P.NodeAudioGraph,MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,CS=MS.ControlSurface?.CONTROL;
if(!I||!R||!CS)return;
const silentTypes=new Set([I.FATHER_TIME,I.BEEN_SERVED,I.GARAGE_BAND,I.MASTER_OF_LEVELS]);
let type="";try{type=C.getRuntime(instance).type}catch(_){try{type=P.NodeGraphEngine?.getModule?.(instance)?.type||""}catch(__){}}
if(silentTypes.has(type)){shell?.remove();return}
document.body?.classList.add("hasPinnedScope");
const parentNode=anchor.parentElement;if(!parentNode)return;
const host=document.createElement("div"),scope=R.mount(host,{id:"moduleScope",control:CS.OSCILLOSCOPE,meta:{trace:[]}});
host.style.cssText="position:absolute;inset:0";scope.style.cssText+=";position:absolute;inset:0;width:100%;height:100%;max-width:none;transform:none";const face=scope.querySelector(".ms-control-face");if(face){face.style.width="100%";face.style.height="100%"}
anchor.replaceWith(host);
const binding={trace:[]};R.bindOscilloscope(scope,binding);
let raf=0,last=0,dead=false,staticPcm=null,data=null;
function commit(samples){binding.trace=samples||[];scope.commitOscilloscopeTrace?.(binding.trace)}
function liveTrace(){let analyser=null;try{analyser=C.getAnalyser(instance)}catch(_){}if(!analyser)return commit([]);if(!data||data.length!==analyser.fftSize)data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);commit(data)}
function draw(ts){if(dead)return;if(document.hidden||ts-last<32){raf=requestAnimationFrame(draw);return}last=ts;if(staticPcm)commit(staticPcm);else liveTrace();raf=requestAnimationFrame(draw)}
addEventListener("multisynth-scope-static",e=>{const pcm=e.detail?.pcm;staticPcm=pcm?.length?pcm:null;if(staticPcm)commit(staticPcm)});
addEventListener("multisynth-scope-live",()=>{staticPcm=null});
try{A?.resume?.()}catch(_){}
raf=requestAnimationFrame(draw);
addEventListener("pagehide",()=>{dead=true;cancelAnimationFrame(raf)});
})();
