"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const KEYS=Object.freeze({RUNNING:"running",LEVEL:"level",BPM:"bpm",STEPS:"steps",DIV_INPUT:"divInput"});
 const ALIASES=Object.freeze({running:Object.freeze(["running"]),level:Object.freeze(["level"]),bpm:Object.freeze(["bpm"]),steps:Object.freeze(["steps"]),divInput:Object.freeze(["divInput"])});
 MS.StateKeys=Object.freeze({...KEYS,ALIASES,get:(state,key,fallback)=>state&&Object.prototype.hasOwnProperty.call(state,key)?state[key]:fallback,patch:(key,value)=>({[key]:value})});
})(window);
