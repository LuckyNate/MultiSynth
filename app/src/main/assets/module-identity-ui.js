"use strict";
(function(global){
  const script=document.currentScript;
  function context(){const parentMS=global.parent&&global.parent!==global?global.parent.MultiSynth:null;return parentMS||global.MultiSynth||{};}
  function resolveType(MS){const I=MS.ModuleIds;if(!I)return null;const key=script?.dataset?.moduleKey;if(key&&I[key])return I[key];const q=new URLSearchParams(global.location.search),direct=q.get("type");if(direct&&I.has(direct))return I.canonicalId(direct);const instance=q.get("instance"),mod=instance?MS.NodeGraphEngine?.getModule?.(instance):null;if(mod)return I.canonicalId(mod.type);return null;}
  function apply(){const MS=context(),I=MS.ModuleIds,type=resolveType(MS);if(!I||!type)return false;const ident=I.identityFor(type);if(!ident)return false;document.title=ident.displayName;document.querySelectorAll("[data-module-name]").forEach(el=>el.textContent=ident.displayName);if(script?.dataset?.bindTitleId){const el=document.getElementById(script.dataset.bindTitleId);if(el)el.textContent=ident.displayName.toUpperCase()}if(script?.dataset?.bindFirstH1==="true"){const h=document.querySelector("h1");if(h)h.textContent=ident.displayName.toUpperCase()}const meta=MS.ModuleManifest?.get?.(type);if(meta?.color&&script?.dataset?.bindAccent==="true")document.documentElement.style.setProperty("--accent",meta.color);document.documentElement.dataset.module=ident.themeKey;return true;}
  if(!apply())global.addEventListener("DOMContentLoaded",apply,{once:true});
  global.MultiSynthIdentityUI=Object.freeze({apply});
})(window);
