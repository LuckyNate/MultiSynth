"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{};
function mount(container,{modules,onPick}={}){const T=MS.ModuleTaxonomy,M=MS.ModuleManifest;if(!container||!T)return null;const source=(modules||M?.all||[]).slice(),wrap=document.createElement("div"),bar=document.createElement("div"),search=document.createElement("input"),families=document.createElement("div"),list=document.createElement("div");wrap.className="moduleSelectorRack";bar.className="moduleSelectorFilters";search.type="search";search.placeholder="FAMILY OR #TAG";search.autocomplete="off";search.spellcheck=false;families.className="moduleFamilyFilters";list.className="moduleRackList";bar.append(search,families);wrap.append(bar,list);container.replaceChildren(wrap);let family="ALL";
function chip(name){const b=document.createElement("button");b.type="button";b.className="moduleFamilyChip";b.textContent=name;b.onclick=()=>{family=name;drawFamilies();draw()};return b}
function drawFamilies(){families.replaceChildren();for(const f of ["ALL",...T.families()]){const b=chip(f);b.classList.toggle("active",f===family);families.appendChild(b)}}
function draw(){list.replaceChildren();const q=search.value;for(const m of source){if(family!=="ALL"&&T.familyFor(m.id)!==family)continue;if(!T.matches(m.id,q))continue;const b=document.createElement("button"),name=m.displayName||m.id,fam=T.familyFor(m.id);b.type="button";b.dataset.moduleId=m.id;b.className=`moduleRackStrip rackModuleIdentity ${m.themeKey||""}`.trim();b.style.setProperty("--module-color",m.color||"#777");b.innerHTML=`<strong>${String(name).toUpperCase()}</strong><span>${fam}</span>`;b.onclick=()=>onPick?.(m,b);list.appendChild(b)}}
search.addEventListener("input",draw);global.addEventListener("multisynth-module-taxonomy-changed",()=>{drawFamilies();draw()});drawFamilies();draw();return Object.freeze({redraw:draw,search,container:wrap,list})}
MS.ModuleSelectorUI=Object.freeze({mount});
})(window);
