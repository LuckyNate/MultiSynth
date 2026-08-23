"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},PREFIX="multisynth.module-test.state:";
const key=type=>PREFIX+String(type||"");
function save(type,state){if(!type)return false;try{localStorage.setItem(key(type),JSON.stringify(state||{}));return true}catch(e){console.error("Module Test persistence save",e);return false}}
function load(type){if(!type)return null;try{return JSON.parse(localStorage.getItem(key(type))||"null")}catch(_){return null}}
function remove(type){if(!type)return false;try{localStorage.removeItem(key(type));return true}catch(_){return false}}
MS.ModuleTestPersistence=Object.freeze({save,load,remove});
})(window);
