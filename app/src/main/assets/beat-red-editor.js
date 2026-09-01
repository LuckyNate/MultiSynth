"use strict";
(function(){
  const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,B=P.ModuleBuilderDefinitions,I=P.ModuleIds,R=window.MultiSynth?.ControlSurfaceRenderer;
  if(!instance||!E||!B||!I||!R)return;
  const model=B.require(I.BEAT_RED),module=E.getModule(instance),root=document.getElementById("controls");
  if(!module||!root)return;
  let state={...model.defaults,...(module.state||{})};
  const selected=()=>Math.max(0,Math.min(11,Math.round(Number(state.selected)||0)));
  const patch=p=>{state={...state,...p};E.setModuleState(instance,p);A?.rebuild?.()};
  const section=className=>{const el=document.createElement("section");el.className=className;root.appendChild(el);return el};
  const byId=id=>model.controls.find(c=>c.id===id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const quant=(v,min,step)=>min+Math.round((v-min)/step)*step;
  root.innerHTML="";
  const globals=section("beatRedGlobal"),voices=section("beatRedPads"),steps=section("beatRedSteps"),voiceControls=section("beatRedVoice");

  function knob(target,d,value,onChange){
    const min=Number(d.value?.min??0),max=Number(d.value?.max??1),step=Number(d.value?.step??1);
    const node=R.mount(target,{...d,value:{...(d.value||{}),default:value},meta:{...(d.meta||{}),visual:{variant:"cap",size:86,valueReadout:true}}});
    const face=node.querySelector(".ms-control-face"),pointer=node.querySelector(".ms-control-pointer"),out=node.querySelector(".ms-control-value");
    let v=Number(value),held=false,pid=null,lastY=0;
    const paint=()=>{const p=clamp((v-min)/(max-min||1),0,1);if(pointer)pointer.style.transform=`translateX(-50%) rotate(${-135+p*270}deg)`;if(out)out.textContent=Number.isInteger(step)?String(Math.round(v)):v.toFixed(2)};
    face.onpointerdown=e=>{e.preventDefault();held=true;pid=e.pointerId;lastY=e.clientY;face.setPointerCapture?.(pid)};
    face.onpointermove=e=>{if(!held||e.pointerId!==pid)return;const nv=clamp(quant(v+(lastY-e.clientY)*(max-min)/180,min,step),min,max);lastY=e.clientY;if(nv===v)return;v=nv;paint();onChange(v)};
    face.onpointerup=face.onpointercancel=e=>{held=false;try{face.releasePointerCapture?.(e.pointerId)}catch(_){}};
    paint();
  }

  function switchControl(target,d,value,onChange){
    const node=R.mount(target,{...d,meta:{...(d.meta||{}),visual:{variant:"hardware"}}});let v=!!value;
    const paint=()=>{node.dataset.on=v?"1":"0";node.dataset.active=v?"1":"0"};
    node.querySelector(".ms-control-face").onclick=()=>{v=!v;paint();onChange(v)};paint();
  }

  function padBank(target,d){
    const wrap=document.createElement("div"),lab=document.createElement("div"),grid=document.createElement("div");wrap.className="ruiControl";lab.className="ruiLabel";lab.textContent=d.label;grid.className="ruiPads";wrap.append(lab,grid);target.appendChild(wrap);
    for(let i=0;i<12;i++){const spec={id:`voice-${i}`,control:"pad",label:d.value.labels[i],meta:{visual:{variant:"square",width:94,height:58}}},node=R.mount(grid,spec);node.dataset.active=i===selected()?"1":"0";node.querySelector(".ms-control-face").onpointerdown=e=>{e.preventDefault();patch({selected:i});grid.querySelectorAll(".ms-control").forEach((n,k)=>n.dataset.active=k===i?"1":"0");renderSteps();renderVoiceControls()}}
  }

  function stepGrid(target,d){
    const wrap=document.createElement("div"),lab=document.createElement("div"),grid=document.createElement("div"),lane=selected();wrap.className="ruiControl";lab.className="ruiLabel";lab.textContent=d.label;grid.className="ruiSteps";wrap.append(lab,grid);target.appendChild(wrap);
    const pattern=(state.pattern||model.defaults.pattern).map(row=>row.slice());
    for(let i=0;i<32;i++){const node=R.mount(grid,{id:`step-${i}`,control:"button",label:String(i+1),meta:{visual:{variant:"square",width:46,height:42}}});node.dataset.active=pattern[lane]?.[i]?"1":"0";node.querySelector(".ms-control-face").onclick=()=>{pattern[lane][i]=pattern[lane][i]?0:1;node.dataset.active=pattern[lane][i]?"1":"0";patch({pattern:pattern.map(row=>row.slice())})}}
  }

  for(const id of ["bpm","swing","steps","clickLevel"]){const d=byId(id);knob(globals,d,state[id]??d.value.default,v=>patch({[id]:v}))}
  for(const id of ["running","clockClick"]){const d=byId(id);switchControl(globals,d,state[id],v=>patch({[id]:v}))}
  padBank(voices,byId("voice"));

  function renderSteps(){steps.innerHTML="";stepGrid(steps,byId("pattern"))}
  const ranges=Object.freeze({pitch:{min:20,max:2000,step:1},decay:{min:20,max:2500,step:1},bend:{min:-2500,max:2500,step:10},tone:{min:0,max:100,step:1},character:{min:0,max:100,step:1},level:{min:0,max:100,step:1}});
  function renderVoiceControls(){voiceControls.innerHTML="";const index=selected(),voice=state.voices?.[index]||model.defaults.voices[index];for(const id of Object.keys(ranges)){const base=byId(id),d={...base,state:id,value:{...ranges[id],default:Number(voice[id])}};knob(voiceControls,d,Number(voice[id]),v=>{const next=(state.voices||model.defaults.voices).map(x=>({...x}));next[index][id]=v;patch({voices:next})})}}
  renderSteps();renderVoiceControls();
})();
