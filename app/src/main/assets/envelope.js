"use strict";
(function(){
const ids=["attack","decay","sustain","release"];
const inputs={};
function fmt(id,v){if(id==="sustain")return Math.round(v*100)+"%";return v<1?Math.round(v*1000)+" ms":v.toFixed(2)+" s";}
function drawEnvelope(){
  const curve=document.getElementById("envelope-curve");
  if(!curve)return;
  const attack=Math.max(.001,Number(inputs.attack?.value)||.001);
  const decay=Math.max(.001,Number(inputs.decay?.value)||.001);
  const sustain=Math.max(0,Math.min(1,Number(inputs.sustain?.value)||0));
  const release=Math.max(.001,Number(inputs.release?.value)||.001);

  const left=20,right=565,top=25,bottom=160;
  const usable=right-left;
  const sustainHold=1.0;
  const total=attack+decay+sustainHold+release;
  const xAttack=left+usable*(attack/total);
  const xDecay=xAttack+usable*(decay/total);
  const xReleaseStart=xDecay+usable*(sustainHold/total);
  const ySustain=bottom-(bottom-top)*sustain;

  curve.setAttribute("points",[
    [left,bottom],
    [xAttack,top],
    [xDecay,ySustain],
    [xReleaseStart,ySustain],
    [right,bottom]
  ].map(p=>p.map(n=>Number(n.toFixed(2))).join(",")).join(" "));
}
for(const id of ids){
  const el=document.getElementById(id),out=document.getElementById(id+"-value");
  if(!el||!out)continue;
  inputs[id]=el;
  const sync=()=>{out.textContent=fmt(id,Number(el.value));drawEnvelope();};
  el.addEventListener("input",sync);
  sync();
}
drawEnvelope();
})();
