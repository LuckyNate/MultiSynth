"use strict";
(function(global){
  const MS=global.MultiSynth||{},I=MS.ModuleIds,C=MS.ModuleContract;
  if(!I||!C)return;
  const defs=C.listDefinitions(),byId=new Map(defs.map(d=>[d.type,d])),problems=[];
  for(const d of defs){
    if(!I.has(d.type))problems.push(`UNREGISTERED MODULE ID: ${d.type}`);
    const theme=I.themeFor(d.type);
    if(d.selectorClass!==theme)problems.push(`THEME KEY MISMATCH: ${d.type} -> ${d.selectorClass} (expected ${theme})`);
  }
  for(const id of I.ALL)if(!byId.has(id))problems.push(`MISSING MODULE DEFINITION: ${id}`);
  if(problems.length)console.error("MultiSynth module identity audit",problems);
  MS.ModuleIdentityAudit=Object.freeze({ok:problems.length===0,problems:Object.freeze(problems.slice())});
})(window);
