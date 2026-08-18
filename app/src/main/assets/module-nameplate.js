"use strict";
(function(global){
  const local=global.MultiSynth?.ModuleIds,parentIds=global.parent&&global.parent!==global?global.parent.MultiSynth?.ModuleIds:null,I=parentIds||local;
  if(!I)return;
  const file=(global.location?.pathname||"").split("/").pop()||"",id=file.replace(/\.html$/i,"");
  if(!I.has(id))return;
  const name=I.displayNameFor(id);
  global.document.title=name;
  const h1=global.document.querySelector("h1");
  if(h1)h1.textContent=name.toUpperCase();
  global.document.documentElement.dataset.module=I.themeFor(id);
})(window);
