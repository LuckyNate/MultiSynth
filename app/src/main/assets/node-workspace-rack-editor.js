"use strict";
(function(global){
const MS=global.MultiSynth||{},E=MS.RackEngine,C=MS.ModuleContract,M=MS.ModuleManifest,A=MS.RackAudioGraph,R=MS.RackLibrary,S=MS.ModuleSelectorUI;
const shell=document.getElementById("nodeRackEditor"),frame=document.getElementById("nodeRackEditorFrame"),closeBtn=document.getElementById("closeNodeRackEditor"),world=document.getElementById("nodeWorld");
if(!shell||!world||!E||!C)return;
const PROJECT_KEY="multisynth.rack.project.v1";
let editingRack=null,drag=null;
if(frame)frame.style.display="none";
const root=document.createElement("div");root.className="nodeWorkspaceRackEditor";root.innerHTML=`
  <section class="nodeWorkspaceRackEditorHeader">
    <div class="nodeWorkspaceRackEditorTitle">
      <small>MULTISYNTH · RACK</small>
      <strong id="nodeWorkspaceRackTitle">RACK</strong>
      <div id="nodeWorkspaceRackStatus" class="nodeWorkspaceRackEditorStatus"></div>
    </div>
    <div class="nodeWorkspaceRackEditorActions">
      <button id="nodeWorkspaceRackNameBtn" type="button">NAME</button>
    </div>
  </section>
  <section id="nodeWorkspaceRackNameRow" class="nodeWorkspaceRackEditorNameRow hidden">
    <input id="nodeWorkspaceRackNameInput" maxlength="80" autocomplete="off" spellcheck="false" aria-label="Rack name">
    <button id="nodeWorkspaceRackNameSave" type="button">SAVE</button>
    <button id="nodeWorkspaceRackNameCancel" type="button">CANCEL</button>
  </section>
  <section class="nodeWorkspaceRackScope">
    <div class="nodeWorkspaceRackScopeHead"><span>RACK MIX OUTPUT</span><small>ONE NODE ON THE GRAPH</small></div>
    <div class="nodeWorkspaceRackScopeLine" aria-hidden="true"></div>
  </section>
  <section class="nodeWorkspaceRackModules">
    <div id="nodeWorkspaceRackList" class="nodeWorkspaceRackList"></div>
    <button id="nodeWorkspaceRackAdd" class="nodeWorkspaceRackEditorAdd" type="button">+ ADD MODULE</button>
    <div class="nodeWorkspaceRackHint">TOP → BOTTOM IS INTERNAL SIGNAL ORDER · HOLD + DRAG TO REORDER · TAP MODULE TO EDIT</div>
  </section>
  <section id="nodeWorkspaceRackChooser" class="nodeWorkspaceRackChooser hidden">
    <div class="nodeWorkspaceRackChooserPanel">
      <div class="nodeWorkspaceRackChooserHead"><strong>ADD MODULE</strong><button id="nodeWorkspaceRackChooserClose" type="button">CLOSE</button></div>
      <div id="nodeWorkspaceRackChooserItems" class="nodeWorkspaceRackChooserItems"></div>
    </div>
  </section>`;
shell.insertBefore(root,shell.firstChild);
const title=root.querySelector("#nodeWorkspaceRackTitle"),status=root.querySelector("#nodeWorkspaceRackStatus"),list=root.querySelector("#nodeWorkspaceRackList"),nameBtn=root.querySelector("#nodeWorkspaceRackNameBtn"),nameRow=root.querySelector("#nodeWorkspaceRackNameRow"),nameInput=root.querySelector("#nodeWorkspaceRackNameInput"),nameSave=root.querySelector("#nodeWorkspaceRackNameSave"),nameCancel=root.querySelector("#nodeWorkspaceRackNameCancel"),addBtn=root.querySelector("#nodeWorkspaceRackAdd"),chooser=root.querySelector("#nodeWorkspaceRackChooser"),chooserItems=root.querySelector("#nodeWorkspaceRackChooserItems"),chooserClose=root.querySelector("#nodeWorkspaceRackChooserClose");
function persist(){try{localStorage.setItem(PROJECT_KEY,E.serialize({selectedRack:editingRack,workspaceType:"node",fromNodeGraph:true,at:Date.now()}))}catch(e){console.error("Node rack save",e)}}
function metaFor(type){try{return M?.get?.(type)||C.getDefinition(type)||null}catch(_){return null}}
function rackName(id){return R?.get?.(id)?.name||String(id)}
function rack(){try{return editingRack?E.getRack(editingRack):null}catch(_){return null}}
function render(){const r=rack();if(!r)return;title.textContent=rackName(r.id).toUpperCase();const g=E.graph(),incoming=(g.connections||[]).filter(c=>c.to===E.rackIn(r.id)).length,outgoing=(g.connections||[]).filter(c=>c.from===E.rackOut(r.id)).length;status.textContent=`NODE GRAPH · IN ${incoming} · OUT ${outgoing} · ${r.modules.length} MODULE${r.modules.length===1?"":"S"}`;list.innerHTML="";if(!r.modules.length){const empty=document.createElement("div");empty.className="nodeWorkspaceRackModule";empty.innerHTML="<strong>EMPTY RACK</strong><small>ADD A MODULE BELOW</small>";list.appendChild(empty);return}for(const m of r.modules){const meta=metaFor(m.type),card=document.createElement("div");card.className="nodeWorkspaceRackModule";card.dataset.moduleId=m.id;card.style.setProperty("--module-color",meta?.color||"#546774");card.innerHTML=`<strong>${String(meta?.displayName||m.displayName||m.type).toUpperCase()}</strong><small>${String(meta?.family||meta?.category||m.category||"MODULE").toUpperCase()}</small><button class="nodeWorkspaceRackModuleRemove" type="button" aria-label="Remove module">×</button>`;card.querySelector("button").addEventListener("click",e=>{e.stopPropagation();try{E.removeModule(r.id,m.id);A?.rebuild?.();persist();render();global.MultiSynthNodePlane?.render?.()}catch(err){console.error(err)}});card.addEventListener("click",e=>{if(e.target.closest("button"))return;if(card.dataset.moved==="1"){card.dataset.moved="0";return}MS.NodeModuleEditor?.open?.(m.id)});card.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;drag={id:e.pointerId,card,startY:e.clientY,startX:e.clientX,active:false,timer:setTimeout(()=>{if(!drag||drag.card!==card)return;drag.active=true;card.classList.add("dragging");try{card.setPointerCapture(e.pointerId)}catch(_){}},260)}});card.addEventListener("pointermove",e=>{if(!drag||drag.id!==e.pointerId||drag.card!==card)return;if(!drag.active&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>10){clearTimeout(drag.timer);drag.timer=null;return}if(!drag.active)return;const others=[...list.querySelectorAll("[data-module-id]")].filter(x=>x!==card),before=others.find(x=>e.clientY<x.getBoundingClientRect().top+x.getBoundingClientRect().height/2);if(before)list.insertBefore(card,before);else list.appendChild(card)});const end=e=>{if(!drag||drag.id!==e.pointerId||drag.card!==card)return;if(drag.timer)clearTimeout(drag.timer);if(drag.active){const order=[...list.querySelectorAll("[data-module-id]")];E.moveModule(r.id,m.id,order.indexOf(card));A?.rebuild?.();persist();card.dataset.moved="1";global.MultiSynthNodePlane?.render?.()}card.classList.remove("dragging");drag=null};card.addEventListener("pointerup",end);card.addEventListener("pointercancel",end);list.appendChild(card)}}
function open(id){try{E.getRack(id)}catch(_){return false}editingRack=id;shell.classList.remove("hidden");render();return true}
function close(){if(!editingRack)return false;editingRack=null;chooser.classList.add("hidden");nameRow.classList.add("hidden");shell.classList.add("hidden");global.MultiSynthNodePlane?.render?.();return true}
function showName(){if(!editingRack)return;nameInput.value=rackName(editingRack);nameRow.classList.remove("hidden");nameInput.focus();nameInput.select()}
function saveName(){if(!editingRack)return;const next=String(nameInput.value||"").trim();if(!R?.rename?.(editingRack,next))R?.registerRack?.(editingRack,next);nameRow.classList.add("hidden");persist();render();global.MultiSynthNodePlane?.render?.()}
function showChooser(){if(!editingRack||!S?.mount)return;S.mount(chooserItems,{modules:M?.all||[],onPick:m=>{try{E.addModule(editingRack,m.id);A?.rebuild?.();persist();chooser.classList.add("hidden");render();global.MultiSynthNodePlane?.render?.()}catch(e){console.error(e)}}});chooser.classList.remove("hidden")}
world.addEventListener("click",e=>{const card=e.target.closest?.('.nodeCard[data-node-kind="rack"]');if(!card)return;if(card.dataset.nodeMoved==="1"){card.dataset.nodeMoved="0";e.preventDefault();e.stopImmediatePropagation();return}e.preventDefault();e.stopImmediatePropagation();open(card.dataset.nodeId)},true);
closeBtn?.addEventListener("click",e=>{if(!editingRack)return;e.preventDefault();e.stopImmediatePropagation();close()},true);
nameBtn.addEventListener("click",showName);nameSave.addEventListener("click",saveName);nameCancel.addEventListener("click",()=>nameRow.classList.add("hidden"));nameInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();saveName()}else if(e.key==="Escape"){e.preventDefault();nameRow.classList.add("hidden")}});addBtn.addEventListener("click",showChooser);chooserClose.addEventListener("click",()=>chooser.classList.add("hidden"));
E.on("graph-changed",()=>{if(editingRack)render()});
const priorBack=global.MultiSynthRackHandleBack;global.MultiSynthRackHandleBack=()=>{if(MS.NodeModuleEditor?.editing){MS.NodeModuleEditor.close();return true}if(editingRack)return close();return typeof priorBack==="function"?priorBack():false};
MS.NodeWorkspaceRackEditor=Object.freeze({open,close,render,get editing(){return editingRack}});
})(window);
