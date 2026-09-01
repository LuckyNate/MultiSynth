"use strict";
(function(){
  const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,B=P.ModuleBuilderDefinitions,I=P.ModuleIds,U=window.ModuleUI;
  if(!instance||!E||!B||!I||!U)return;
  const model=B.require(I.BEAT_RED),module=E.getModule(instance),root=document.getElementById("controls");
  if(!module||!root)return;
  let state={...model.defaults,...(module.state||{})};
  const selected=()=>Math.max(0,Math.min(11,Math.round(Number(state.selected)||0)));
  const patch=p=>{state={...state,...p};E.setModuleState(instance,p);A?.rebuild?.()};
  const section=className=>{const el=document.createElement("section");el.className=className;root.appendChild(el);return el};
  root.innerHTML="";
  const globals=section("beatRedGlobal"),voices=section("beatRedPads"),steps=section("beatRedSteps"),voiceControls=section("beatRedVoice");
  const byId=id=>model.controls.find(c=>c.id===id);

  function renderGlobal(){
    globals.innerHTML="";
    for(const id of ["bpm","swing","steps","clickLevel","running","clockClick"]){
      const control=byId(id);if(!control)continue;
      U.renderControl(globals,control,{state,defaults:model.defaults,patch});
    }
  }

  function renderVoices(){
    voices.innerHTML="";
    const control=byId("voice");if(!control)return;
    U.renderControl(voices,control,{state,defaults:model.defaults,patch:p=>{patch(p);queueMicrotask(()=>{renderSteps();renderVoiceControls()})}});
  }

  function renderSteps(){
    steps.innerHTML="";
    const control=byId("pattern");if(!control)return;
    U.renderControl(steps,control,{state,defaults:model.defaults,patch});
  }

  const ranges=Object.freeze({
    pitch:{min:20,max:2000,step:1},
    decay:{min:20,max:2500,step:1},
    bend:{min:-2500,max:2500,step:10},
    tone:{min:0,max:100,step:1},
    character:{min:0,max:100,step:1},
    level:{min:0,max:100,step:1}
  });

  function renderVoiceControls(){
    voiceControls.innerHTML="";
    const index=selected(),voice=state.voices?.[index]||model.defaults.voices[index];
    for(const id of Object.keys(ranges)){
      const base=byId(id),range=ranges[id];if(!base)continue;
      const control={...base,state:id,value:{...range,default:Number(voice[id])}};
      U.renderControl(voiceControls,control,{state:{[id]:Number(voice[id])},defaults:{[id]:Number(voice[id])},patch:p=>{
        if(!(id in p))return;
        const next=(state.voices||model.defaults.voices).map(v=>({...v}));
        next[index][id]=p[id];
        patch({voices:next});
      }});
    }
  }

  renderGlobal();
  renderVoices();
  renderSteps();
  renderVoiceControls();
})();
