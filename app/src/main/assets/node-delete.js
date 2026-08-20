"use strict";
(function(global){
  const MS=global.MultiSynth||{},E=MS.RackEngine,A=MS.RackAudioGraph;
  const world=document.getElementById("nodeWorld");
  if(!E||!world)return;

  function findRackForModule(moduleId){
    return E.graph().racks.find(r=>(r.modules||[]).some(m=>m.id===moduleId))||null;
  }

  function removeNode(card){
    const kind=card?.dataset?.nodeKind,id=card?.dataset?.nodeId;
    if(!kind||!id)return;
    try{
      if(kind==="rack"){
        E.removeRack(id);
      }else if(kind==="module"){
        const rack=findRackForModule(id);
        if(!rack)return;
        if(String(rack.id).startsWith("nodehost-")) E.removeRack(rack.id);
        else E.removeModule(rack.id,id);
      }
      A?.rebuild?.();
      global.MultiSynthNodePlane?.flash?.("REMOVED");
    }catch(err){
      console.error(err);
      global.MultiSynthNodePlane?.flash?.("REMOVE FAILED");
    }
  }

  function decorate(card){
    if(!card||card.querySelector(":scope > .nodeRemove"))return;
    const x=document.createElement("button");
    x.type="button";
    x.className="nodeRemove";
    x.setAttribute("aria-label","Remove node");
    x.textContent="×";
    x.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation()});
    x.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();removeNode(card)});
    card.appendChild(x);
  }

  function decorateAll(){world.querySelectorAll(".nodeCard").forEach(decorate)}
  const observer=new MutationObserver(decorateAll);
  observer.observe(world,{childList:true,subtree:true});
  decorateAll();
})(window);
