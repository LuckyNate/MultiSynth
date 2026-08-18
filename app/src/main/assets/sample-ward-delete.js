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
async function decorate(){
    if(decorating)return;
    decorating=true;
    try{
        const items=await L.list();
        const rows=[...lib.querySelectorAll(":scope > .sample")].filter(row=>!row.querySelector("strong")?.textContent?.includes("WARD EMPTY"));
        rows.forEach((row,index)=>{
            if(row.dataset.wardDeleteReady||row.querySelector(".wardDelete"))return;
            const item=items[index],strong=row.querySelector("strong");
            if(!item||!strong)return;
            row.dataset.wardDeleteReady="1";
            row.dataset.pcmId=item.id;
            row.classList.add("wardSampleRow");
            const del=document.createElement("button");
            del.type="button";
            del.className="wardDelete";
            del.textContent="DELETE";
            del.setAttribute("aria-label","Delete "+item.name+" from PCM library");
            del.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation()});
            del.addEventListener("click",async e=>{
                e.preventDefault();e.stopPropagation();
                await removeSample(row.dataset.pcmId,row,item.name);
            });
            row.appendChild(del);
        });
    }finally{decorating=false}
}
const mo=new MutationObserver(()=>requestAnimationFrame(()=>decorate().catch(console.error)));
mo.observe(lib,{childList:true,subtree:false});
decorate().catch(console.error);
})();
