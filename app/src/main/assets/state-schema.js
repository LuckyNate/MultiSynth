"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{},versions=new Map();
 function register(moduleId,version=1,migrate=null){const v=Math.max(1,Number(version)||1);versions.set(String(moduleId),Object.freeze({version:v,migrate:typeof migrate==="function"?migrate:null}));return v;}
 function versionFor(moduleId,fallback=1){return versions.get(String(moduleId))?.version||fallback;}
 function restore(moduleId,saved,savedVersion){const spec=versions.get(String(moduleId));if(!spec||!spec.migrate||!savedVersion||Number(savedVersion)>=spec.version)return saved;return spec.migrate(saved,Number(savedVersion),spec.version);}
 MS.StateSchema=Object.freeze({register,versionFor,restore,describe:moduleId=>versions.get(String(moduleId))||Object.freeze({version:1,migrate:null})});
})(window);
