"use strict";
(()=>{
  const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,C=P.ModuleContract,R=window.MultiSynth?.ControlSurfaceRenderer,root=document.getElementById("controls");
  if(!instance||!E||!C||!R||!root)throw new Error("TIME BANDITS EDITOR UNAVAILABLE");
  const module=E.getModule(instance);if(!module)throw new Error("TIME BANDITS INSTANCE NOT FOUND");
  const def=C.getDefinition(module.type);
  const VOICES=["SUB","KICK","SNARE","TOM 1","TOM 2","TOM 3","CRASH","RIDE","CHINA","HAT CLOSED","HAT OPEN","TAMBOURINE","CLAP","COWBELL","CLAVE","RIMSHOT"];
  const BASE=[{pitch:42,decay:1200,bend:-700,tone:28,character:65,level:88},{pitch:58,decay:520,bend:-1500,tone:52,character:72,level:92},{pitch:190,decay:360,bend:-250,tone:68,character:72,level:80},{pitch:130,decay:720,bend:-380,tone:52,character:38,level:80},{pitch:205,decay:720,bend:-380,tone:52,character:38,level:80},{pitch:320,decay:720,bend:-380,tone:52,character:38,level:80},{pitch:520,decay:1450,bend:0,tone:76,character:70,level:68},{pitch:760,decay:1900,bend:0,tone:70,character:58,level:66},{pitch:620,decay:1250,bend:-120,tone:62,character:84,level:68},{pitch:1250,decay:90,bend:0,tone:88,character:65,level:62},{pitch:1250,decay:650,bend:0,tone:88,character:65,level:60},{pitch:900,decay:420,bend:0,tone:82,character:80,level:64},{pitch:1100,decay:330,bend:0,tone:72,character:62,level:72},{pitch:587,decay:360,bend:0,tone:56,character:62,level:72},{pitch:1250,decay:70,bend:0,tone:66,character:45,level:74},{pitch:455,decay:85,bend:0,tone:78,character:72,level:74}];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),copy=v=>JSON.parse(JSON.stringify(v));
  let state={...(def.defaults||{}),...(module.state||{})};
  const selected=()=>clamp(Math.round(Number(state.selected)||0),0,VOICES.length-1);
  const send=patch=>E.setModuleState(instance,patch);
  const mount=(parent,d,visual={})=>R.mount(parent,{...d,meta:{...(d.meta||{}),visual:{...(d.meta?.visual||{}),...visual}}});

  function normalize(){
    const p=state.pattern,pr=state.probabilities,v=state.voices;
    state.pattern=BASE.map((_,lane)=>Array.from({length:32},(_,step)=>p?.[lane]?.[step]?1:0));
    state.probabilities=BASE.map((_,lane)=>Array.from({length:32},(_,step)=>clamp(pr?.[lane]?.[step]??100,0,100)));
    state.voices=BASE.map((base,i)=>({...base,...(v?.[i]||{})}));
  }
  normalize();
  root.innerHTML="";root.classList.add("ms-module-surface");
  const scopeTemplate=document.getElementById("timeBanditsSharedScope");if(scopeTemplate)root.appendChild(scopeTemplate.content.cloneNode(true));
  function bank(title,layout){const s=document.createElement("section"),h=document.createElement("div"),g=document.createElement("div");s.className="ms-module-bank";h.className="ms-module-bank-title";h.textContent=title;g.className=`ms-control-grid ${layout}`;s.append(h,g);root.appendChild(s);return g;}

  const voiceBank=bank("VOICE / TRACK","ms-layout-pads tb-voice-grid"),seqBank=bank("SEQUENCER","tb-sequencer-grid"),paramBank=bank("SELECTED VOICE","ms-layout-params"),stepBank=bank("32 STEP TRIGGERS","ms-layout-steps"),probBank=bank("SELECTED VOICE PROBABILITY","ms-layout-knobs");

  const run=mount(seqBank,{id:"running",control:"switch",state:"running",label:"MOD / RUN"},{variant:"vertical"});
  run.addEventListener("multisynth-control-switch-change",e=>send({running:!!e.detail?.on}));

  const globalKnobs=new Map();
  function globalKnob(id,label,min,max,step,unit=""){
    const node=mount(seqBank,{id,control:"knob",state:id,label,value:{default:Number(state[id]??min),min,max,step},meta:{unit}},{variant:"cap",valueReadout:true});
    const binding={key:`time-bandits.${id}`,get value(){return Number(state[id]??min)},set value(v){send({[id]:v})},get locked(){return false},set locked(){}};
    R.bindKnob(node,binding);globalKnobs.set(id,node);return node;
  }
  globalKnob("bpm","BPM",30,300,1," BPM");globalKnob("swing","SWING",0,100,1,"%");globalKnob("steps","LENGTH",1,32,1,"");

  const voiceNodes=[];
  for(let i=0;i<VOICES.length;i++){
    const node=mount(voiceBank,{id:`voice-${i}`,control:"pad",label:VOICES[i]},{variant:"square"});
    node.classList.add("tb-voice-selector");node.dataset.voice=String(i);
    const face=node.querySelector(".ms-control-face");if(face){const text=document.createElement("span");text.className="tb-voice-face-label";text.textContent=VOICES[i];face.appendChild(text)}
    node.addEventListener("multisynth-control-pad-tap",()=>{if(i===selected()&&!state.running)send({auditionNonce:Date.now()});else send({selected:i})});
    voiceNodes.push(node);
  }

  const ranges={pitch:{label:"PITCH",min:20,max:3000,step:1},decay:{label:"DECAY",min:20,max:2500,step:1},bend:{label:"BEND",min:-2500,max:2500,step:10},tone:{label:"TONE",min:0,max:100,step:1},character:{label:"CHARACTER",min:0,max:100,step:1},level:{label:"LEVEL",min:0,max:100,step:1}};
  const paramNodes=new Map();
  function bindVoiceParam(key){
    const spec=ranges[key],i=selected(),node=paramNodes.get(key)||mount(paramBank,{id:key,control:"knob",label:spec.label,value:{default:Number(state.voices?.[i]?.[key]??BASE[i][key]),min:spec.min,max:spec.max,step:spec.step}},{variant:"cap",valueReadout:true});
    if(!paramNodes.has(key))paramNodes.set(key,node);
    const binding={key:`time-bandits.voice.${i}.${key}`,get value(){return Number(state.voices?.[i]?.[key]??BASE[i][key])},set value(v){const voices=copy(state.voices);voices[i]={...voices[i],[key]:v};send({voices})},get locked(){return false},set locked(){}};
    node.dataset.bindingKey=binding.key;R.bindKnob(node,binding);node.setModuleValue?.(binding.value);
  }
  Object.keys(ranges).forEach(bindVoiceParam);

  const probability=mount(probBank,{id:"probability",control:"knob",label:"PROBABILITY",value:{default:100,min:0,max:100,step:1},meta:{unit:"%"}},{variant:"cap",valueReadout:true});
  function bindProbability(){
    const i=selected(),binding={key:`time-bandits.voice.${i}.probability`,get value(){return Number(state.probabilities?.[i]?.[0]??100)},set value(v){const probabilities=copy(state.probabilities);probabilities[i]=Array(32).fill(clamp(v,0,100));send({probabilities})},get locked(){return !!state.probabilityLocks?.[i]},set locked(v){send({probabilityLocks:{...(state.probabilityLocks||{}),[i]:!!v}})}};
    probability.dataset.bindingKey=binding.key;R.bindKnob(probability,binding);probability.setModuleValue?.(binding.value);probability.setControlLocked?.(binding.locked,{silent:true});
  }
  bindProbability();

  const stepNodes=[];
  for(let i=0;i<32;i++){
    const node=mount(stepBank,{id:`step-${i}`,control:"button",label:String(i+1)},{variant:"rect"});
    node.addEventListener("multisynth-control-button-tap",()=>{const pattern=copy(state.pattern),lane=selected();pattern[lane][i]=pattern[lane][i]?0:1;send({pattern})});
    stepNodes.push(node);
  }

  function paintRun(){run.commitSwitchState?.(!!state.running,{silent:true});const label=run.querySelector(".ms-control-label");if(label)label.textContent=state.running?"RUN":"MOD";}
  function paintVoices(){const current=selected();voiceNodes.forEach((node,i)=>{node.dataset.selected=i===current?"1":"0";});}
  function paintSteps(){const lane=selected();stepNodes.forEach((node,i)=>node.commitButtonState?.(!!state.pattern?.[lane]?.[i],{silent:true}));}
  function paintGlobals(){for(const [key,node] of globalKnobs)node.setModuleValue?.(state[key]);}
  function rebindSelected(){Object.keys(ranges).forEach(bindVoiceParam);bindProbability();paintVoices();paintSteps();}

  paintRun();paintGlobals();rebindSelected();
  const onState=e=>{
    const before=state;state={...(def.defaults||{}),...(e.detail||{})};normalize();
    paintRun();paintGlobals();
    const selectionChanged=Number(before.selected)!==Number(state.selected),voicesChanged=before.voices!==state.voices,patternChanged=before.pattern!==state.pattern,probChanged=before.probabilities!==state.probabilities,locksChanged=before.probabilityLocks!==state.probabilityLocks;
    if(selectionChanged)rebindSelected();else{
      if(voicesChanged)Object.keys(ranges).forEach(key=>paramNodes.get(key)?.setModuleValue?.(state.voices?.[selected()]?.[key]));
      if(patternChanged)paintSteps();
      if(probChanged)probability.setModuleValue?.(state.probabilities?.[selected()]?.[0]??100);
      if(locksChanged)probability.setControlLocked?.(!!state.probabilityLocks?.[selected()],{silent:true});
    }
  };
  window.addEventListener("multisynth-state-sync",onState);
  window.addEventListener("pagehide",()=>window.removeEventListener("multisynth-state-sync",onState),{once:true});
})();
