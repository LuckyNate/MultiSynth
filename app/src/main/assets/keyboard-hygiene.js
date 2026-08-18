"use strict";
(function(root){
function editable(el){
  if(!el||el.nodeType!==1)return false;
  if(el.isContentEditable)return true;
  const tag=(el.tagName||"").toLowerCase();
  if(tag==="textarea")return true;
  if(tag!=="input")return false;
  const type=(el.getAttribute("type")||"text").toLowerCase();
  return !["button","checkbox","color","file","hidden","image","radio","range","reset","submit"].includes(type);
}
function blurDoc(doc){
  try{const a=doc&&doc.activeElement;if(editable(a))a.blur()}catch(_){}
}
function hook(doc){
  if(!doc||doc.__multiSynthKeyboardHygiene)return;
  doc.__multiSynthKeyboardHygiene=true;
  doc.addEventListener("pointerdown",function(e){if(!editable(e.target))blurDoc(doc)},true);
  doc.addEventListener("submit",function(){setTimeout(function(){blurDoc(doc)},0)},true);
  doc.addEventListener("keydown",function(e){if(e.key==="Enter"&&editable(e.target)&&(e.target.tagName||"").toLowerCase()!=="textarea"&&!e.target.isContentEditable){setTimeout(function(){blurDoc(doc)},0)}},true);
  function hookFrames(){
    let frames=[];try{frames=Array.from(doc.querySelectorAll("iframe"))}catch(_){}
    frames.forEach(function(frame){
      if(frame.__multiSynthKeyboardHook)return;
      frame.__multiSynthKeyboardHook=true;
      function attach(){try{hook(frame.contentDocument)}catch(_){}}
      frame.addEventListener("load",attach);attach();
    });
  }
  hookFrames();
  try{new MutationObserver(hookFrames).observe(doc.documentElement||doc,{childList:true,subtree:true})}catch(_){}
}
root.MultiSynthDismissKeyboard=function(){
  try{hook(root.document);blurDoc(root.document)}catch(_){}
  try{root.document.querySelectorAll("iframe").forEach(function(f){try{blurDoc(f.contentDocument)}catch(_){}})}catch(_){}
};
hook(root.document);
})(window);
