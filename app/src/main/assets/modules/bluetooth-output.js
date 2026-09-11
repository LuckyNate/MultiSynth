"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const defaults={};
function create(api){const c=api.context,input=c.createGain(),output=c.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{input,output}}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.BLUETOOTH_OUTPUT,version:"module-builder-1",description:"GENERAL BLUETOOTH CARRIER OUTPUT · CONNECTED MEANS PLAYING",defaults,resources:["nativeAudio"],create,destroy,serialize:()=>({}),restore:()=>({})});
C.defineSurface(I.BLUETOOTH_OUTPUT,{family:"SIGNAL PROCESSORS",version:1,package:{id:I.BLUETOOTH_OUTPUT,version:1,behavior:{role:"general-bluetooth-output-terminal",routing:"carrier-to-current-system-bluetooth-endpoint",activation:"automatic-when-bluetooth-connected",controls:"none",carSafety:"car-endpoints-remain-tail-gator-gated",stateOwnership:"none"}},faceplate:{livery:"bluetooth-output",primary:"#07131f",secondary:"#6fb7ff",tertiary:"#e6f3ff"},defaults,controls:[],sources:[{id:"source.audio",type:"audioInput"}],actions:[{id:"action.route",type:"terminalSystemBluetoothRoute",mode:"automatic"}],nodes:{connections:[["source.audio","action.route"]]}});

if(global.parent===global)return;
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine;if(!instance||!E)return;const module=E.getModule(instance);if(!module)return;const root=document.getElementById("controls"),desc=document.getElementById("desc");root.innerHTML="";root.classList.add("ms-module-surface");if(desc)desc.textContent="CONNECTED MEANS PLAYING";
const host=document.createElement("section");host.className="ms-module-bank";const title=document.createElement("div");title.className="ms-module-bank-title";title.textContent="BLUETOOTH OUTPUT";const label=document.createElement("div");label.className="ms-module-bank-title";label.textContent="SYSTEM BLUETOOTH ROUTE";host.append(title,label);root.appendChild(host);
})(window);
