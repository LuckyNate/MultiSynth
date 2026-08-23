"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},M=MS.ModuleManifest,B=MS.ModuleBuilderDefinitions;
const TAG_STORE="multisynth.module.tags.v1",FAMILY_STORE="multisynth.module.families.v1";
const FAMILY_BY_CATEGORY=Object.freeze({input:"SIGNAL SOURCE",generator:"SIGNAL SOURCE",instrument:"SIGNAL SOURCE",modulator:"SIGNAL SOURCE",rhythm:"TIMED INSTRUMENT",clock:"TIMED INSTRUMENT",sampler:"TIMED INSTRUMENT",utility:"FILE UTILITY",granular:"AUDIO PROCESSOR",effect:"AUDIO PROCESSOR",looper:"AUDIO PROCESSOR",controller:"CONTROLLER",routing:"ROUTING / OUTPUT"});
const TAG_ALIASES=Object.freeze({audioInput:"audio-in",audioOutput:"audio-out",generator:"generator",noteInput:"keyboard",clockSource:"clock-source",clockFollower:"clock-follow",dvInput:"dv",cvInput:"cv-in",cvOutput:"cv-out",terminalOutput:"terminal",mic:"mic",pcm:"pcm",midi:"midi",storage:"storage",nativeAudio:"native-audio"});
function normalizeTag(v){const s=String(v||"").trim().toLowerCase().replace(/^#+/,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"");return s?"#"+s:""}
function normalizeFamily(v){return String(v||"").trim().replace(/\s+/g," ").toUpperCase()}
function familyTagFor(id){const s=familyFor(id).toLowerCase().replace(/[^a-z0-9]+/g,"");return s?"#"+s:"#module"}
function load(store){try{const x=JSON.parse(localStorage.getItem(store)||"{}");return x&&typeof x==="object"?x:{}}catch(_){return{}}}
function save(store,x){localStorage.setItem(store,JSON.stringify(x))}
function defaultFamilyFor(id){const m=M?.get?.(id),d=B?.get?.(id);return normalizeFamily(d?.family||d?.taxonomy?.family||FAMILY_BY_CATEGORY[m?.category]||"MODULE")}
function familyFor(id){const all=load(FAMILY_STORE),v=normalizeFamily(all[String(id)]);return v||defaultFamilyFor(id)}
function setFamily(id,family){const all=load(FAMILY_STORE),key=String(id),v=normalizeFamily(family);if(v)all[key]=v;else delete all[key];save(FAMILY_STORE,all);global.dispatchEvent(new CustomEvent("multisynth-module-taxonomy-changed",{detail:{id:key,family:familyFor(key),familyTag:familyTagFor(key)}}));return familyFor(key)}
function automaticTags(id){const m=M?.get?.(id),d=B?.get?.(id),set=new Set([familyTagFor(id)]),add=v=>{const t=normalizeTag(v);if(t)set.add(t)};add(m?.category);for(const x of m?.capabilities||[])add(TAG_ALIASES[x]||x);for(const x of m?.resources||[])add(TAG_ALIASES[x]||x);for(const x of d?.tags||d?.taxonomy?.tags||[])add(x);for(const c of d?.controls||[]){add(c.control);if(c.control==="keyboard")add("keyboard");for(const o of c.value?.options||[])if(["sine","square","triangle","saw","sawtooth","noise","white","pink","red","blue"].includes(String(o).toLowerCase()))add(o)}const blob=JSON.stringify(d?.sources||[]).toLowerCase();for(const w of ["sine","square","triangle","saw","noise","white","pink","red","blue","clock","mic","pcm"])if(blob.includes(w))add(w);return[...set].sort()}
function userTagsFor(id){const all=load(TAG_STORE),arr=Array.isArray(all[String(id)])?all[String(id)]:[];return arr.map(normalizeTag).filter(Boolean).filter(t=>t!==familyTagFor(id))}
function tagsFor(id){return[familyTagFor(id),...[...new Set([...automaticTags(id),...userTagsFor(id)])].filter(t=>t!==familyTagFor(id)).sort()]}
function setUserTags(id,tags){const all=load(TAG_STORE),primary=familyTagFor(id),arr=[...new Set((Array.isArray(tags)?tags:String(tags||"").split(/[\s,]+/)).map(normalizeTag).filter(Boolean).filter(t=>t!==primary))].sort();if(arr.length)all[String(id)]=arr;else delete all[String(id)];save(TAG_STORE,all);global.dispatchEvent(new CustomEvent("multisynth-module-taxonomy-changed",{detail:{id:String(id),tags:arr,familyTag:primary}}));return arr}
function matches(id,query){const q=String(query||"").trim().toLowerCase();if(!q)return true;const m=M?.get?.(id),hay=[m?.displayName,familyFor(id),...tagsFor(id)].join(" ").toLowerCase();return q.split(/\s+/).every(x=>hay.includes(x))}
MS.ModuleTaxonomy=Object.freeze({familyFor,defaultFamilyFor,familyTagFor,setFamily,tagsFor,userTagsFor,setUserTags,matches,normalizeTag,normalizeFamily,families:()=>Object.freeze([...new Set((M?.all||[]).map(x=>familyFor(x.id)))].sort())});
})(window);
