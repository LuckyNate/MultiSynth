"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const defs=new Map();
  const freezeDeep=v=>{if(!v||typeof v!=="object"||Object.isFrozen(v))return v;Object.values(v).forEach(freezeDeep);return Object.freeze(v)};
  function define(spec){
    if(!spec?.id)throw new Error("Module Builder definition requires id");
    const id=String(spec.id);
    if(defs.has(id))throw new Error("Duplicate Module Builder definition: "+id);
    const out=freezeDeep({...spec});
    defs.set(id,out);
    return out;
  }
  function get(id){return defs.get(String(id||""))||null}
  function requireDef(id){const d=get(id);if(!d)throw new Error("Missing Module Builder definition: "+id);return d}
  MS.ModuleBuilderDefinitions=Object.freeze({define,get,require:requireDef,all:()=>Object.freeze([...defs.values()])});
})(window);
