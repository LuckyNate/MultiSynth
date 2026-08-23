"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},M=MS.ModuleManifest,B=MS.ModuleBuilderDefinitions;
const STORE="multisynth.module.tags.v1";
const FAMILY_BY_CATEGORY=Object.freeze({input:"SIGNAL SOURCE",generator:"SIGNAL SOURCE",instrument:"SIGNAL SOURCE",modulator:"SIGNAL SOURCE",rhythm:"TIMED INSTRUMENT",clock:"TIMED INSTRUMENT",sampler:"TIMED INSTRUMENT",utility:"FILE UTILITY",granular:"AUDIO PROCESSOR",effect:"AUDIO PROCESSOR",looper:"AUDIO PROCESSOR",controller:"CONTROLLER",routing:"ROUTING / OUTPUT"});
const TAG_ALIASES=Object.freeze({audioInput:"audio-in",audioOutput:"audio-out",generator:"generator",noteInput:"keyboard",clockSource:"clock-source",clockFollower:"clock-follow",dvInput:"dv",cvInput:"cv-in",cvOutput:"cv-out",terminalOutput:"terminal",mic:"mic",pcm:"pcm",midi:"midi",storage:"storage",nativeAudio:"native-audio"});
function normalizeTag(v){const s=String(v||"").trim().toLowerCase().replace(/^#+/,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"");return s?"#"+s:""}
function loadUser(){try{const x=JSON.parse(localStorage.getItem(STORE)||"{}");return x&&typeof x==="object"?x:{}}catch(_){return{}}}
function saveUser(x){localStorage.setItem(STORE,JSON.stringify(x))}
function familyFor(id){const m=M?.get?.(id),d=B?.get?.(id);return String(d?.family||d?.taxonomy?.family||FAMILY_BY_CATEGORY[m?.category]||"MODULE").toUpperCase()}
function automaticTags(id){const m=M?.get?.(id),d=B?.get?.(id),set=new Set(),add=v=>{const t=normalizeTag(v);if(t)set.add(t)};add(m?.category);add(familyFor(id));for(const x of m?.capabilities||[])add(TAG_ALIASES[x]||x);for(const x of m?.resources||[])add(TAG_ALIASES[x]||x);for(const x of d?.tags||d?.taxonomy?.tags||[])add(x);for(const c of d?.controls||[]){add(c.control);if(c.control==="keyboard")add("keyboard");for(const o of c.value?.options||[])if(["sine","square","triangle","saw","sawtooth","noise","white","pink","red","blue"].includes(String(o).toLowerCase()))add(o)}const blob=JSON.stringify(d?.sources||[]).toLowerCase();for(const w of ["sine","square","triangle","saw","noise","white","pink","red","blue","clock","mic","pcm"])if(blob.includes(w))add(w);return[...set].sort()}
function userTagsFor(id){const all=loadUser(),arr=Array.isArray(all[String(id)])?all[String(id)]:[];return arr.map(normalizeTag).filter(Boolean)}
function tagsFor(id){return[...new Set([...automaticTags(id),...userTagsFor(id)])].sort()}
function setUserTags(id,tags){const all=loadUser(),arr=[...new Set((Array.isArray(tags)?tags:String(tags||"").split(/[\s,]+/)).map(normalizeTag).filter(Boolean))].sort();if(arr.length)all[String(id)]=arr;else delete all[String(id)];saveUser(all);global.dispatchEvent(new CustomEvent("multisynth-module-tags-changed",{detail:{id:String(id),tags:arr}}));return arr}
function matches(id,query){const q=String(query||"").trim().toLowerCase();if(!q)return true;const m=M?.get?.(id),hay=[m?.displayName,familyFor(id),...tagsFor(id)].join(" ").toLowerCase();return q.split(/\s+/).every(x=>hay.includes(x))}
MS.ModuleTaxonomy=Object.freeze({familyFor,tagsFor,userTagsFor,setUserTags,matches,normalizeTag,families:()=>Object.freeze([...new Set((M?.all||[]).map(x=>familyFor(x.id)))].sort())});
})(window);
