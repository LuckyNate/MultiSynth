"use strict";
(function(){
  const wires=document.getElementById("nodeWires");
  if(!wires)return;
  const NS="http://www.w3.org/2000/svg";
  const palette=[
    ["#ef6262","#8e3030"],
    ["#f08a4b","#96522c"],
    ["#e5bd4f","#8a6c25"],
    ["#68c86f","#36773b"],
    ["#4cc8b5","#28776d"],
    ["#55a9e8","#2c6794"],
    ["#7b83eb","#454b98"],
    ["#ad72df","#67438a"],
    ["#df6faf","#8b416c"]
  ];
  const colors=new Map();
  function pairFor(edgeId){
    if(!colors.has(edgeId))colors.set(edgeId,palette[Math.floor(Math.random()*palette.length)]);
    return colors.get(edgeId);
  }
  function endpoint(path,atEnd){
    const length=path.getTotalLength();
    return path.getPointAtLength(atEnd?length:0);
  }
  function endCap(point,color,edgeId){
    const c=document.createElementNS(NS,"circle");
    c.setAttribute("class","nodeCableEnd");
    c.setAttribute("cx",point.x);
    c.setAttribute("cy",point.y);
    c.setAttribute("r","7");
    c.setAttribute("fill",color);
    c.setAttribute("stroke","#050607");
    c.setAttribute("stroke-width","2");
    c.dataset.edgeId=edgeId;
    c.style.pointerEvents="none";
    return c;
  }
  function styleCables(){
    for(const hit of wires.querySelectorAll(".nodeWireHit[data-edge-id]")){
      const edgeId=hit.dataset.edgeId;
      const path=hit.previousElementSibling;
      if(!path?.classList?.contains("nodeWire")||path.dataset.cableStyled==="1")continue;
      const [color,dark]=pairFor(edgeId);
      path.dataset.cableStyled="1";
      path.style.stroke=color;
      path.style.opacity=".94";
      try{
        wires.insertBefore(endCap(endpoint(path,false),dark,edgeId),hit);
        wires.insertBefore(endCap(endpoint(path,true),dark,edgeId),hit);
      }catch(_){}
    }
  }
  new MutationObserver(()=>requestAnimationFrame(styleCables)).observe(wires,{childList:true});
  styleCables();
})();
