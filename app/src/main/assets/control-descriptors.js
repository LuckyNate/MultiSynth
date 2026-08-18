"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const TYPES=Object.freeze({KNOB:"knob",TOGGLE:"toggle",SELECT:"select",RANGE:"range"});
 function normalize(d){if(!d||!d.key)throw new Error("Control descriptor requires state key");const type=String(d.type||TYPES.RANGE);if(!Object.values(TYPES).includes(type))throw new Error("Unknown control type: "+type);return Object.freeze({type,key:String(d.key),label:String(d.label||d.key),unit:d.unit==null?null:String(d.unit),min:Number.isFinite(d.min)?d.min:null,max:Number.isFinite(d.max)?d.max:null,step:Number.isFinite(d.step)?d.step:null,options:Array.isArray(d.options)?Object.freeze(d.options.map(x=>typeof x==="object"?Object.freeze({...x}):x)):Object.freeze([]),default:d.default,elementId:d.elementId?String(d.elementId):null});}
 MS.ControlDescriptors=Object.freeze({...TYPES,normalize,list:list=>Object.freeze((list||[]).map(normalize)),read:(descriptor,state)=>state?.[descriptor.key],write:(descriptor,value)=>({[descriptor.key]:value})});
})(window);
