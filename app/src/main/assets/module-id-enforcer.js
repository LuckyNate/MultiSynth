"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},base=MS.ModuleContract,I=MS.ModuleIds;
  if(!base||!I)throw new Error("ModuleIds and ModuleContract must load before module-id-enforcer");
  const api={};
  for(const key of Object.keys(base))api[key]=base[key];
  api.define=def=>base.define(I.canonicalDefinition(def));
  MS.ModuleContract=Object.freeze(api);
})(window);
