"use strict";
(function(global){
  const notes=Array.isArray(global.MultiSynthReleaseNotes)?global.MultiSynthReleaseNotes:[];
  const currentBuild=Number(global.MultiSynthReleaseBuild)||Math.max(0,...notes.map(n=>Number(n.build)||0));
  function readBaseline(){
    try{
      const saved=Number(localStorage.getItem("multisynth.release-last-build"));
      if(Number.isFinite(saved)&&saved>0)return saved;
      let legacy=0;
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i)||"";
        const m=key.match(/^multisynth\.release-notice\.build-(\d+)-/);
        if(m&&localStorage.getItem(key)==="ok")legacy=Math.max(legacy,Number(m[1])||0);
      }
      return legacy;
    }catch(_){return 0}
  }
  const baseline=readBaseline();
  const effectiveBaseline=baseline>0?baseline:Math.max(0,currentBuild-1);
  const unseen=notes.filter(note=>{const build=Number(note.build)||0;return build>effectiveBaseline&&build<=currentBuild}).sort((a,b)=>(Number(a.build)||0)-(Number(b.build)||0));
  if(!unseen.length)return;
  function show(){
    if(document.getElementById("multiSynthReleaseNotice"))return;
    const shade=document.createElement("div");shade.id="multiSynthReleaseNotice";shade.style.cssText="position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,.72);box-sizing:border-box";
    const card=document.createElement("section");card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");card.setAttribute("aria-labelledby","releaseNoticeTitle");card.style.cssText="width:min(560px,100%);max-height:min(78vh,760px);overflow:auto;box-sizing:border-box;border:1px solid #7f8790;border-radius:14px;padding:22px;background:#171a1e;color:#f2f3f4;font:15px/1.45 system-ui,sans-serif;box-shadow:0 18px 60px #000";
    const title=document.createElement("strong");title.id="releaseNoticeTitle";title.textContent=unseen.length===1?(unseen[0].title||"WHAT'S NEW"):"WHAT YOU MISSED";title.style.cssText="display:block;font-size:20px;letter-spacing:.06em;margin-bottom:14px";
    const body=document.createElement("div");
    for(const note of unseen){
      if(unseen.length>1){const h=document.createElement("strong");h.textContent=note.title||`BUILD ${note.build||""}`;h.style.cssText="display:block;margin:16px 0 8px;font-size:15px;letter-spacing:.05em";body.appendChild(h)}
      const ul=document.createElement("ul");ul.style.cssText="margin:0 0 12px;padding-left:20px";
      for(const line of note.lines||[]){const li=document.createElement("li");li.textContent=line;li.style.cssText="margin:0 0 7px";ul.appendChild(li)}
      body.appendChild(ul);
    }
    const ok=document.createElement("button");ok.type="button";ok.textContent="OK";ok.style.cssText="display:block;width:100%;margin-top:18px;padding:13px;border:1px solid #9aa3ad;border-radius:9px;background:#2a3037;color:#fff;font:700 15px system-ui,sans-serif";
    const dismiss=()=>{try{for(const note of unseen)localStorage.setItem("multisynth.release-notice."+note.id,"ok");if(currentBuild>0)localStorage.setItem("multisynth.release-last-build",String(currentBuild))}catch(_){}shade.remove()};
    ok.addEventListener("click",dismiss);shade.addEventListener("click",e=>{if(e.target===shade)dismiss()});card.append(title,body,ok);shade.appendChild(card);document.body.appendChild(shade);ok.focus();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show,{once:true});else show();
  global.MultiSynthReleaseNotice=Object.freeze({current:unseen[unseen.length-1],unseen:Object.freeze([...unseen]),show});
})(window);
