"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 const replacements=new Map([
  ["time-divider",Object.freeze({to:"time-bandits",mapState(state={}){const keep=["bpm","division","probability","pitch","decay","tone","level","pcmKey","sampleName"],out={};for(const k of keep)if(Object.prototype.hasOwnProperty.call(state,k))out[k]=clone(state[k]);return out;}})]
 ]);
 function resolve(type,state={}){const from=MS.ModuleIds?.canonicalId?.(type)||String(type||""),rule=replacements.get(from);if(!rule)return{type:from,state:clone(state),replaced:false,from,to:from};const to=MS.ModuleIds?.canonicalId?.(rule.to)||rule.to;return{type:to,state:rule.mapState?rule.mapState(state):clone(state),replaced:true,from,to};}
 function isRetired(type){const id=MS.ModuleIds?.canonicalId?.(type)||String(type||"");return replacements.has(id)}
 MS.ModuleCompatibility=Object.freeze({resolve,isRetired,replacements:Object.freeze([...replacements.keys()])});
})(window);
