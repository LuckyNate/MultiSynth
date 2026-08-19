"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.RackEngine;if(!E)return;
const PREFIX="multisynth.module-test.state:";
const isTestRack=id=>String(id||"").startsWith("rack-test-");
const key=type=>PREFIX+String(type||"");
function save(type,state){if(!type)return;try{localStorage.setItem(key(type),JSON.stringify(state||{}))}catch(e){console.error("Module Test persistence save",e)}}
function load(type){try{return JSON.parse(localStorage.getItem(key(type))||"null")}catch(_){return null}}
E.on("module-added",e=>{const rackId=e?.rackId,m=e?.module;if(!isTestRack(rackId)||!m?.id||!m?.type)return;const saved=load(m.type);if(saved&&typeof saved==="object")try{E.setModuleState(rackId,m.id,saved)}catch(e){console.error("Module Test persistence restore",e)}});
E.on("module-state",e=>{const rackId=e?.rackId,moduleId=e?.moduleId;if(!isTestRack(rackId)||!moduleId)return;try{const rack=E.getRack(rackId),m=rack.modules.find(x=>x.id===moduleId);if(m)save(m.type,e.state||m.state)}catch(err){console.error("Module Test persistence",err)}});
})(window);
