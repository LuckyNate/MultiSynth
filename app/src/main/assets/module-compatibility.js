"use strict";
(function(global){
 const MS=global.MultiSynth=global.MultiSynth||{};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v)),replacements=new Map();
 function canonical(type){return MS.ModuleIds?.canonicalId?.(type)||String(type||"")}
 function makeMapper(spec={}){if(typeof spec.mapState==="function")return spec.mapState;const copy=Array.isArray(spec.copyState)?spec.copyState.map(String):null,rename=spec.renameState&&typeof spec.renameState==="object"?spec.renameState:null,defaults=spec.defaults&&typeof spec.defaults==="object"?clone(spec.defaults):null;return state=>{state=clone(state||{});const out=defaults?clone(defaults):{};if(copy)for(const k of copy)if(Object.prototype.hasOwnProperty.call(state,k))out[k]=state[k];else if(!rename)Object.assign(out,state);if(rename)for(const [from,to] of Object.entries(rename))if(Object.prototype.hasOwnProperty.call(state,from))out[String(to)]=state[from];return out}}
 function replaceModule(from,to,migration=null,meta={}){from=canonical(from);to=canonical(to);if(!from||!to)throw new Error("Module replacement requires source and target ids");const spec=migration&&typeof migration==="object"&&!Array.isArray(migration)?migration:{mapState:typeof migration==="function"?migration:null};replacements.set(from,Object.freeze({to,mapState:makeMapper(spec),packageId:String(meta.packageId||to),packageVersion:Number(meta.packageVersion)||1}));return from}
 function registerPackage(pkg){if(!pkg?.id)return false;for(const r of pkg.replaces||[])if(r?.from)replaceModule(r.from,pkg.id,r,{packageId:pkg.id,packageVersion:pkg.version});return true}
 function registerBuilderPackages(){for(const d of MS.ModuleBuilderDefinitions?.all?.()||[])if(d?.package)registerPackage(d.package)}
 registerBuilderPackages();
 function resolve(type,state={}){const from=canonical(type),rule=replacements.get(from);if(!rule)return{type:from,state:clone(state),replaced:false,from,to:from};const to=canonical(rule.to);return{type:to,state:rule.mapState(clone(state)),replaced:true,from,to,packageId:rule.packageId,packageVersion:rule.packageVersion}}
 function isRetired(type){return replacements.has(canonical(type))}
 MS.ModuleCompatibility=Object.freeze({replaceModule,registerPackage,registerBuilderPackages,resolve,isRetired,listReplacements:()=>Object.freeze([...replacements.entries()].map(([from,r])=>Object.freeze({from,to:r.to,packageId:r.packageId,packageVersion:r.packageVersion})))});
})(window);
