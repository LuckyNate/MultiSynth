"use strict";
(function(global){
  const notes=Array.isArray(global.MultiSynthReleaseNotes)?global.MultiSynthReleaseNotes:[];
  const unseen=notes.find(note=>{try{return localStorage.getItem("multisynth.release-notice."+note.id)!=="ok"}catch(_){return true}});
  if(!unseen)return;
  function show(){
    if(document.getElementById("multiSynthReleaseNotice"))return;
    const shade=document.createElement("div");shade.id="multiSynthReleaseNotice";shade.style.cssText="position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,.72);box-sizing:border-box";
    const card=document.createElement("section");card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");card.setAttribute("aria-labelledby","releaseNoticeTitle");card.style.cssText="width:min(520px,100%);box-sizing:border-box;border:1px solid #7f8790;border-radius:14px;padding:22px;background:#171a1e;color:#f2f3f4;font:15px/1.45 system-ui,sans-serif;box-shadow:0 18px 60px #000";
    const title=document.createElement("strong");title.id="releaseNoticeTitle";title.textContent=unseen.title||"WHAT CHANGED";title.style.cssText="display:block;font-size:20px;letter-spacing:.06em;margin-bottom:14px";
    const body=document.createElement("div");for(const line of unseen.lines||[]){const p=document.createElement("p");p.textContent=line;p.style.cssText="margin:0 0 10px";body.appendChild(p)}
    const ok=document.createElement("button");ok.type="button";ok.textContent="OK";ok.style.cssText="display:block;width:100%;margin-top:18px;padding:13px;border:1px solid #9aa3ad;border-radius:9px;background:#2a3037;color:#fff;font:700 15px system-ui,sans-serif";
    const dismiss=()=>{try{localStorage.setItem("multisynth.release-notice."+unseen.id,"ok")}catch(_){}shade.remove()};
    ok.addEventListener("click",dismiss);shade.addEventListener("click",e=>{if(e.target===shade)dismiss()});card.append(title,body,ok);shade.appendChild(card);document.body.appendChild(shade);ok.focus();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show,{once:true});else show();
  global.MultiSynthReleaseNotice=Object.freeze({current:unseen,show});
})(window);
