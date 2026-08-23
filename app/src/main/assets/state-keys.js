"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const KEYS=Object.freeze({RUNNING:"running",LEVEL:"level",BPM:"bpm",STEPS:"steps"});
 const ALIASES=Object.freeze({running:Object.freeze(["running"]),level:Object.freeze(["level"]),bpm:Object.freeze(["bpm"]),steps:Object.freeze(["steps"])});
 const canonical=key=>{const raw=String(key||"");return KEYS[raw.toUpperCase()]||raw};
 const aliases=key=>ALIASES[canonical(key)]||Object.freeze([canonical(key)]);
 function resolve(state,key){if(!state)return null;for(const k of aliases(key))if(Object.prototype.hasOwnProperty.call(state,k))return k;return null}
 function get(state,key,fallback){const k=resolve(state,key);return k==null?fallback:state[k]}
 function patch(key,value,state=null){const k=resolve(state,key)||canonical(key);return{[k]:value}}
 function normalizePatch(input,state=null){const out={};for(const[k,v]of Object.entries(input||{})){const c=canonical(k),known=Object.values(KEYS).includes(c);if(known)Object.assign(out,patch(c,v,state));else out[k]=v}return out}
 MS.StateKeys=Object.freeze({...KEYS,ALIASES,canonical,aliases,resolve,get,patch,normalizePatch});
})(window);
