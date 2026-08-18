"use strict";
(()=>{
const P=parent.MultiSynth||{},L=P.PCMLibrary,lib=document.getElementById("library"),status=document.getElementById("status");
if(!L||!lib)return;
let decorating=false;
async function removeSample(id,row,name){
    if(!id)return;
    try{
        await L.remove(id);
        row?.remove();
        if(status)status.textContent=`REMOVED FROM PCM LIBRARY · ${name||"SAMPLE"}`;
        if(!lib.querySelector(".sample"))lib.innerHTML='<div class="sample"><strong>WARD EMPTY · NO PCM SAMPLES</strong></div>';
    }catch(e){
        if(status)status.textContent="DELETE ERROR · "+(e?.message||e);
    }
}
function decorate(){
    if(decorating)return;
    decorating=true;
    try{
        for(const row of lib.querySelectorAll(":scope > .sample")){
            if(row.dataset.wardDeleteReady||row.querySelector(".wardDelete"))continue;
            const strong=row.querySelector("strong");
            if(!strong||strong.textContent.includes("WARD EMPTY"))continue;
            row.dataset.wardDeleteReady="1";
            const name=strong.textContent.trim();
            const id=[...lib.children].indexOf(row);
            row.classList.add("wardSampleRow");
            const del=document.createElement("button");
            del.type="button";
            del.className="wardDelete";
            del.textContent="DELETE";
            del.setAttribute("aria-label","Delete "+name+" from PCM library");
            del.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation()});
            del.addEventListener("click",async e=>{
                e.preventDefault();e.stopPropagation();
                const items=await L.list();
                const match=items.find(x=>x.name===name&&String(x.duration?.toFixed?.(2)||"")===String(row.querySelector("small")?.textContent?.match(/([0-9.]+)s/)?.[1]||""))||items.find(x=>x.name===name)||items[id];
                await removeSample(match?.id,row,name);
            });
            row.appendChild(del);
        }
    }finally{decorating=false}
}
const mo=new MutationObserver(()=>requestAnimationFrame(decorate));
mo.observe(lib,{childList:true,subtree:false});
decorate();
})();
