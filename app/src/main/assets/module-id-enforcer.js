"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},base=MS.ModuleContract,I=MS.ModuleIds,M=MS.ModuleManifest;
  if(!base||!I)throw new Error("ModuleIds and ModuleContract must load before module-id-enforcer");
  const api={};
  for(const key of Object.keys(base))api[key]=base[key];
  api.define=def=>{
    const canonical=I.canonicalDefinition(def),meta=M?.get(canonical.type);
    if(!meta)return base.define(canonical);
    return base.define({...canonical,displayName:meta.displayName,category:meta.category,color:meta.color??canonical.color,selectorClass:meta.themeKey||canonical.selectorClass,editorUrl:meta.editorUrl??canonical.editorUrl,resources:Array.from(meta.resources||[])});
  };
  MS.ModuleContract=Object.freeze(api);
})(window);
