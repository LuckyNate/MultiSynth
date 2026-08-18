"use strict";
(function(global){
 const MS=global.MultiSynth||{},I=MS.ModuleIds,M=MS.ModuleManifest,C=MS.ModuleContract,K=MS.ModuleCapabilities,S=MS.StateSchema;if(!I||!M||!C)return;
 const errors=[],warnings=[];
 for(const id of I.ALL){const meta=M.get(id);if(!meta){errors.push("manifest missing "+id);continue;}const cap=K?.validate(meta.capabilities);if(cap&&!cap.ok)errors.push(id+" unknown capabilities: "+cap.unknown.join(", "));if(!S?.versionFor(id))errors.push(id+" missing state schema version");try{const def=C.getDefinition(id);if(def.displayName!==meta.displayName)warnings.push(id+" displayName legacy definition differs from manifest");if(def.editorUrl&&meta.editorUrl&&def.editorUrl!==meta.editorUrl)warnings.push(id+" editorUrl legacy definition differs from manifest");}catch(e){errors.push(id+" not registered in ModuleContract");}}
 for(const def of C.listDefinitions())if(!I.has(def.type))errors.push("unregistered module id "+def.type);
 const report=Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),warnings:Object.freeze(warnings),checked:I.ALL.length});
 MS.ModuleStandards=Object.freeze({report,metadata:id=>M.require(id),definition:id=>C.getDefinition(id),describe:id=>Object.freeze({metadata:M.require(id),definition:C.getDefinition(id),stateSchemaVersion:S?.versionFor(id,1)||1})});
 if(errors.length)console.error("MultiSynth standards audit",report);else if(warnings.length)console.warn("MultiSynth standards audit",report);
})(window);
