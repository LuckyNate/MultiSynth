"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;
  if(!I||!B)return;
  function all(){return Object.freeze(I.ALL.map(id=>B.get(id)).filter(Boolean))}
  function missing(){return Object.freeze(I.ALL.filter(id=>!B.get(id)))}
  MS.ModuleBuilderCatalog=Object.freeze({all,missing,get complete(){return missing().length===0}});
})(window);
