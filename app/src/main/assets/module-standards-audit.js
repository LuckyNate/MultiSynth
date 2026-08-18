"use strict";
(function(global){
 const MS=global.MultiSynth||{},I=MS.ModuleIds,M=MS.ModuleManifest,C=MS.ModuleContract,K=MS.ModuleCapabilities,S=MS.StateSchema,E=MS.Events,Q=MS.StateKeys,D=MS.ControlDescriptors;if(!I||!M||!C)return;
 const errors=[],warnings=[],sameList=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort()),requiredCaps=["audioInput","audioOutput","generator","noteInput","cvInput","cvOutput","clockSource","clockFollower","divInput","mic","pcm","midi","terminalOutput"];
 if(!E)errors.push("event registry missing");
 if(!Q)errors.push("state-key registry missing");else for(const key of ["RUNNING","LEVEL","BPM","STEPS","DIV_INPUT"])if(!Q[key])errors.push("shared state key missing "+key);
 if(!D)errors.push("control descriptor registry missing");else for(const type of ["KNOB","TOGGLE","SELECT","RANGE"])if(!D[type])errors.push("control descriptor type missing "+type);
 if(!K)errors.push("capability registry missing");else for(const cap of requiredCaps)if(!K.ALL?.includes(cap))errors.push("capability missing "+cap);
 for(const id of I.ALL){
  const meta=M.get(id);if(!meta){errors.push("manifest missing "+id);continue;}
  const cap=K?.validate(meta.capabilities);if(cap&&!cap.ok)errors.push(id+" unknown capabilities: "+cap.unknown.join(", "));
  if(!S?.declared||!Object.prototype.hasOwnProperty.call(S.declared,id))errors.push(id+" missing explicit state schema declaration");
  else if(!S.versionFor(id))errors.push(id+" invalid state schema version");
  if(meta.editorUrl&&!/\.html(?:$|[?#])/.test(meta.editorUrl))errors.push(id+" invalid editor URL "+meta.editorUrl);
  try{
   const def=C.getDefinition(id);
   if(def.displayName!==meta.displayName)errors.push(id+" displayName not manifest-owned");
   if(def.category!==meta.category)errors.push(id+" category not manifest-owned");
   if(def.editorUrl!==meta.editorUrl)errors.push(id+" editorUrl not manifest-owned");
   if(def.selectorClass!==meta.themeKey)errors.push(id+" theme not manifest-owned");
   if((def.color??null)!==(meta.color??null))errors.push(id+" color not manifest-owned");
   if(!sameList(def.resources,meta.resources))errors.push(id+" resources not manifest-owned");
  }catch(e){errors.push(id+" not registered in ModuleContract");}
 }
 for(const def of C.listDefinitions())if(!I.has(def.type))errors.push("unregistered module id "+def.type);
 const report=Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),warnings:Object.freeze(warnings),checked:I.ALL.length});
 MS.ModuleStandards=Object.freeze({report,metadata:id=>M.require(id),definition:id=>C.getDefinition(id),describe:id=>Object.freeze({metadata:M.require(id),definition:C.getDefinition(id),stateSchemaVersion:S?.versionFor(id,1)||1})});
 if(errors.length)console.error("MultiSynth standards audit",report);else if(warnings.length)console.warn("MultiSynth standards audit",report);
})(window);
