"use strict";
(function(global){
const MENU=[
  {id:"module-test",label:"TEST MODULES",href:"module-test.html"},
  {id:"racks",label:"RACKS",href:"workspace-library.html?type=rack"},
  {id:"node-graph",label:"NODE GRAPH",href:"nodebuilder.html"},
  {id:"module-builder",label:"MODULE BUILDER",disabled:true},
  {id:"main-menu",label:"MAIN MENU",href:"index.html"}
];
function currentMode(){
  const p=(location.pathname.split("/").pop()||"").toLowerCase();
  if(p==="module-test.html")return"module-test";
  if(p==="rackbuilder.html"||p==="workspace-library.html")return"racks";
  if(p==="nodebuilder.html")return"node-graph";
  if(p==="index.html"||!p)return"main-menu";
  return"";
}
function mount(host=document.getElementById("msModeNav")){
  if(!host)return null;
  const active=currentMode();
  host.classList.add("msModeNav");
  host.setAttribute("aria-label","MultiSynth modes");
  host.innerHTML="";
  for(const item of MENU){
    if(item.id===active)continue;
    if(item.disabled){
      const span=document.createElement("span");
      span.className="disabled";
      span.setAttribute("aria-disabled","true");
      span.textContent=item.label;
      host.appendChild(span);
      continue;
    }
    const a=document.createElement("a");
    a.href=item.href;
    a.textContent=item.label;
    host.appendChild(a);
  }
  return host;
}
global.MultiSynth=global.MultiSynth||{};
global.MultiSynth.ModeNavigation=Object.freeze({mount,items:MENU.map(x=>Object.freeze({...x}))});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>mount(),{once:true});else mount();
})(window);
