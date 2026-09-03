"use strict";
(function(global){
  const NOTICE=Object.freeze({
    id:"2026-09-03-module-cleanup",
    title:"HEY — HEADS UP",
    lines:Object.freeze([
      "Beat Red has been retired.",
      "Time Bandits is now the full 16-voice drum machine, with one probability control applied across the selected drum channel's sequenced hits.",
      "Old Beat Red patch instances migrate to Time Bandits when loaded."
    ])
  });
  const key="multisynth.release-notice."+NOTICE.id;
  try{if(localStorage.getItem(key)==="ok")return}catch(_){}
  function show(){
    if(document.getElementById("multiSynthReleaseNotice"))return;
    const shade=document.createElement("div");shade.id="multiSynthReleaseNotice";shade.className="releaseNoticeShade";
    const card=document.createElement("section");card.className="releaseNoticeCard";card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");card.setAttribute("aria-labelledby","releaseNoticeTitle");
    const title=document.createElement("strong");title.id="releaseNoticeTitle";title.className="releaseNoticeTitle";title.textContent=NOTICE.title;
    const body=document.createElement("div");body.className="releaseNoticeBody";
    for(const line of NOTICE.lines){const p=document.createElement("p");p.textContent=line;body.appendChild(p)}
    const ok=document.createElement("button");ok.type="button";ok.className="releaseNoticeOk";ok.textContent="OK";
    const dismiss=()=>{try{localStorage.setItem(key,"ok")}catch(_){}shade.remove()};
    ok.addEventListener("click",dismiss);shade.addEventListener("click",e=>{if(e.target===shade)dismiss()});
    card.append(title,body,ok);shade.appendChild(card);document.body.appendChild(shade);ok.focus();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show,{once:true});else show();
  global.MultiSynthReleaseNotice=Object.freeze({current:NOTICE,show});
})(window);
