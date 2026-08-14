"use strict";
/* MultiSynth universal persistence. Every page gets automatic durable UI state. */
(function(global){
 const PREFIX="multisynth.always.v1:";
 const params=new URLSearchParams(location.search);
 const instance=params.get("instance");
 const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
 const key=PREFIX+(instance?"instance:"+instance:"page:"+page);
 const skip=new Set(["file","button","submit","reset"]);
 let restoring=true,timer=null;
 function controls(){return [...document.querySelectorAll("input,select,textarea")].filter(el=>el.id&&!skip.has((el.type||"").toLowerCase()));}
 function snapshot(){const data={v:1,page,instance,controls:{},scrollX:global.scrollX,scrollY:global.scrollY,at:Date.now()};for(const el of controls()){data.controls[el.id]={value:el.value,checked:!!el.checked,type:el.type||el.tagName};}return data;}
 function save(){if(restoring)return;try{localStorage.setItem(key,JSON.stringify(snapshot()));}catch(e){console.warn("AlwaysSave",e);}}
 function queue(){clearTimeout(timer);timer=setTimeout(save,40);}
 function restore(){let data=null;try{data=JSON.parse(localStorage.getItem(key)||"null");}catch(_){}if(data?.controls)for(const el of controls()){const s=data.controls[el.id];if(!s)continue;if(el.type==="checkbox"||el.type==="radio")el.checked=!!s.checked;else el.value=s.value;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}restoring=false;setTimeout(()=>{if(data&&Number.isFinite(data.scrollY))global.scrollTo(data.scrollX||0,data.scrollY||0);},0);}
 document.addEventListener("input",queue,true);document.addEventListener("change",queue,true);document.addEventListener("click",queue,true);document.addEventListener("pointerup",queue,true);
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")save();});global.addEventListener("pagehide",save);global.addEventListener("beforeunload",save);
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(restore,0),{once:true});else setTimeout(restore,0);
 global.MultiSynthAlwaysSave=Object.freeze({save,restore,key});
})(window);
