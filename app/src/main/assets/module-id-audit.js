"use strict";
(function(global){
  const MS=global.MultiSynth||{},I=MS.ModuleIds,C=MS.ModuleContract;
  if(!I||!C)return;
  const defs=C.listDefinitions(),byId=new Map(defs.map(d=>[d.type,d])),problems=[];
  for(const d of defs){
    if(!I.has(d.type)){problems.push(`UNREGISTERED MODULE ID: ${d.type}`);continue;}
    const ident=I.identityFor(d.type);
    if(!ident){problems.push(`MISSING IDENTITY CATALOG ENTRY: ${d.type}`);continue;}
    if(d.type!==ident.id)problems.push(`ID MISMATCH: ${d.type} (expected ${ident.id})`);
    if(d.displayName!==ident.displayName)problems.push(`DISPLAY NAME MISMATCH: ${d.type} -> ${d.displayName} (expected ${ident.displayName})`);
    if(d.selectorClass!==ident.themeKey)problems.push(`THEME KEY MISMATCH: ${d.type} -> ${d.selectorClass} (expected ${ident.themeKey})`);
  }
  for(const [key,ident] of Object.entries(I.CATALOG||{})){
    if(I[key]!==ident.id)problems.push(`SYMBOLIC ID MISMATCH: ${key}`);
    if(!byId.has(ident.id))problems.push(`MISSING MODULE DEFINITION: ${ident.id}`);
  }
  if(problems.length)console.error("MultiSynth module identity audit",problems);
  MS.ModuleIdentityAudit=Object.freeze({ok:problems.length===0,problems:Object.freeze(problems.slice())});
})(window);
