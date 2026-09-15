"use strict";
(()=>{
  const query=new URLSearchParams(location.search),instance=query.get("instance"),Host=parent.MultiSynth||{},Engine=Host.NodeGraphEngine,Contract=Host.ModuleContract,Renderer=window.MultiSynth?.ControlSurfaceRenderer,Library=Host.UnifiedLibrary||Host.PCMLibrary,root=document.getElementById("controls");
  if(!instance||!Engine||!Contract||!Renderer||!root)throw new Error("WHITMAN SAMPLER EDITOR UNAVAILABLE");
  const module=Engine.getModule(instance);if(!module)throw new Error("WHITMAN SAMPLER INSTANCE NOT FOUND");
  const def=Contract.getDefinition(module.type);let state={...(def.defaults||{}),...(module.state||{})};
  const SLOT_COUNT=16,STEP_COUNT=32,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),copy=v=>JSON.parse(JSON.stringify(v));
  root.innerHTML="";root.classList.add("ms-module-surface");

  function bank(title,layout){const section=document.createElement("section");section.className="ms-module-bank";const heading=document.createElement("div");heading.className="ms-module-bank-title";heading.textContent=title;const grid=document.createElement("div");grid.className=`ms-control-grid ${layout}`;section.append(heading,grid);root.appendChild(section);return grid;}
  const mount=(parent,descriptor,visual={})=>Renderer.mount(parent,{...descriptor,meta:{...(descriptor.meta||{}),visual:{...(descriptor.meta?.visual||{}),...visual}}});
  const send=patch=>Engine.setModuleState(instance,patch);
  const selected=()=>clamp(state.selectedSample,0,SLOT_COUNT-1);
  const slotAt=index=>state.samples?.[clamp(index,0,SLOT_COUNT-1)]||{};
  function updateSample(index,changes){const samples=copy(state.samples||[]);while(samples.length<SLOT_COUNT)samples.push({});samples[index]={...(samples[index]||{}),...changes,locks:{...(samples[index]?.locks||{}),...(changes.locks||{})}};send({samples});}

  const transport=bank("TRANSPORT","ms-layout-transport"),timing=bank("TIMING","ms-layout-knobs"),slots=bank("16 SAMPLE PADS","ms-layout-steps"),libraryBank=bank("PCM LIBRARY","ms-layout-list"),params=bank("SELECTED SAMPLE","ms-layout-params"),steps=bank("32 STEPS","ms-layout-steps");

  const record=mount(transport,{id:"record",control:"button",label:"RECORD INPUT"},{variant:"rect"});
  record.addEventListener("multisynth-control-button-press",()=>send({recording:true,recordSlot:selected()}));
  record.addEventListener("multisynth-control-button-release",()=>send({recording:false}));

  function switchControl(id,label,key){const node=mount(transport,{id,control:"switch",state:key,label},{variant:"rocker"});node.addEventListener("multisynth-control-switch-change",event=>send({[key]:!!event.detail?.on}));return node;}
  const runSwitch=switchControl("running","RUN","running"),previewSwitch=switchControl("previewPlaying","PLAY SELECTED","previewPlaying");

  const globalKnobs=new Map();
  function bindGlobalKnob(id,label,key,min,max,step,unit=""){
    const node=mount(timing,{id,control:"knob",state:key,label,value:{default:Number(state[key]??min),min,max,step},meta:{unit}},{variant:"cap",valueReadout:true}),binding={key:`whitman.${key}`,get value(){return Number(state[key]??min)},set value(v){send({[key]:v})},get locked(){return !!state.locks?.[key]},set locked(v){send({locks:{...(state.locks||{}),[key]:!!v}})}};
    Renderer.bindKnob(node,binding);globalKnobs.set(key,node);return node;
  }
  bindGlobalKnob("bpm","BPM","bpm",30,300,1," BPM");bindGlobalKnob("swing","SWING","swing",0,100,1,"%");bindGlobalKnob("length","LENGTH","steps",1,32,1,"");

  const slotNodes=[];
  for(let index=0;index<SLOT_COUNT;index++){
    const node=mount(slots,{id:`sample-${index}`,control:"pad",label:String(index+1).padStart(2,"0")},{variant:"square"});
    node.classList.add("whitman-slot");node.dataset.slot=String(index);node.addEventListener("multisynth-control-pad-tap",()=>send({selectedSample:index,recordSlot:index}));slotNodes.push(node);
  }

  const paramNodes=new Map(),paramSpecs={pitch:{label:"PITCH",min:-24,max:24,step:1,unit:" st"},level:{label:"LEVEL",min:0,max:1,step:.01,unit:""},leftLevel:{label:"LEFT",min:0,max:1,step:.01,unit:""},rightLevel:{label:"RIGHT",min:0,max:1,step:.01,unit:""},lagMs:{label:"L/R LAG",min:-.05,max:.05,step:.001,unit:" s"}};
  function ensureParamNode(key){
    if(paramNodes.has(key))return paramNodes.get(key);
    const spec=paramSpecs[key],node=mount(params,{id:key,control:"knob",label:spec.label,value:{default:0,min:spec.min,max:spec.max,step:spec.step},meta:{unit:spec.unit}},{variant:"cap",valueReadout:true});paramNodes.set(key,node);return node;
  }
  function bindSelectedParams(){
    const index=selected();
    for(const [key,spec] of Object.entries(paramSpecs)){
      const node=ensureParamNode(key),binding={key:`whitman.sample.${index}.${key}`,get value(){return Number(slotAt(index)[key]??0)},set value(v){updateSample(index,{[key]:v})},get locked(){return !!slotAt(index).locks?.[key]},set locked(v){updateSample(index,{locks:{[key]:!!v}})}};
      node.dataset.bindingKey=binding.key;Renderer.bindKnob(node,binding);node.setModuleValue?.(binding.value);node.setControlLocked?.(binding.locked,{silent:true});
    }
  }
  function paintSelectedParams(){const index=selected();for(const [key,node] of paramNodes){node.setModuleValue?.(Number(slotAt(index)[key]??0));node.setControlLocked?.(!!slotAt(index).locks?.[key],{silent:true});}}

  const stepNodes=[];
  for(let index=0;index<STEP_COUNT;index++){
    const node=mount(steps,{id:`step-${index}`,control:"button",label:String(index+1)},{variant:"rect"});
    node.addEventListener("multisynth-control-button-tap",()=>{const sample=selected(),sequence=Array.from({length:STEP_COUNT},(_,step)=>slotAt(sample).sequence?.[step]?1:0);sequence[index]=sequence[index]?0:1;updateSample(sample,{sequence});});stepNodes.push(node);
  }

  const screen=mount(libraryBank,{id:"library",control:"screen",label:"SAVED SAMPLES"},{variant:"scroll",height:260}),screenFace=screen.querySelector(".ms-control-face");let libraryList=document.createElement("div"),libraryToken=0;libraryList.className="whitman-library-list";screenFace?.appendChild(libraryList);
  async function choosePCM(id,index=selected()){
    if(!Library?.get)return;const full=await Library.get(id);if(!full)return;
    updateSample(index,{name:full.name,pcmKey:full.id,start:0,end:Number(full.duration)||0});
  }
  async function drawLibrary(){
    const token=++libraryToken,chosen=selected(),chosenKey=slotAt(chosen).pcmKey||null,scroll=screenFace?.scrollTop||0,next=document.createElement("div");next.className="whitman-library-list";
    const items=Library?.list?await Library.list():[];if(token!==libraryToken)return;let activeRow=null;
    if(!items.length){const empty=document.createElement("div");empty.className="whitman-library-empty";empty.textContent="NO SAVED SAMPLES";next.appendChild(empty);}else for(const item of items){
      const full=Library?.get?await Library.get(item.id):null;if(token!==libraryToken)return;const row=document.createElement("div");row.className="ms-list-row whitman-library-row";
      if(chosenKey!=null&&String(item.id)===String(chosenKey)){row.dataset.selected="1";activeRow=row;}next.appendChild(row);
      let choice=null;
      choice=Renderer.mountLibraryChoice(row,{id:`use-${item.id}`,label:`${item.name} · ${(item.duration||0).toFixed(2)}s`,data:full?.data,sampleRate:full?.sampleRate||item.sampleRate,active:chosenKey!=null&&String(item.id)===String(chosenKey),onSelect:()=>{const target=selected();if(choice)choice.dataset.bindingKey=`whitman.sample.${target}.pcm`;return choosePCM(item.id,target).catch(console.error);}});choice.dataset.bindingKey=`whitman.sample.${chosen}.pcm`;
    }
    if(token!==libraryToken)return;libraryList.replaceWith(next);libraryList=next;
    if(screenFace){screenFace.scrollTop=Math.min(scroll,Math.max(0,screenFace.scrollHeight-screenFace.clientHeight));if(activeRow)requestAnimationFrame(()=>{if(token!==libraryToken||!activeRow.isConnected)return;const top=activeRow.offsetTop,bottom=top+activeRow.offsetHeight,viewTop=screenFace.scrollTop,viewBottom=viewTop+screenFace.clientHeight;if(top<viewTop)screenFace.scrollTop=top;else if(bottom>viewBottom)screenFace.scrollTop=Math.max(0,bottom-screenFace.clientHeight);});}
  }

  function paintSlots(){const current=selected();slotNodes.forEach((node,index)=>{node.dataset.selected=index===current?"1":"0";node.dataset.loaded=slotAt(index).pcmKey?"1":"0";});}
  function paintSteps(){const sample=selected(),sequence=slotAt(sample).sequence||[];stepNodes.forEach((node,index)=>node.commitButtonState?.(!!sequence[index],{silent:true}));}
  function paintGlobal(){runSwitch.commitSwitchState?.(!!state.running,{silent:true});previewSwitch.commitSwitchState?.(!!state.previewPlaying,{silent:true});record.commitButtonState?.(!!state.recording,{silent:true});for(const [key,node] of globalKnobs){node.setModuleValue?.(state[key]);node.setControlLocked?.(!!state.locks?.[key],{silent:true});}}

  function refreshSelection({redrawLibrary=false,rebind=false}={}){paintSlots();paintSteps();if(rebind)bindSelectedParams();else paintSelectedParams();if(redrawLibrary)drawLibrary().catch(console.error);}

  paintGlobal();bindSelectedParams();paintSlots();paintSteps();drawLibrary().catch(console.error);

  const onPcmLibrary=()=>drawLibrary().catch(console.error),onGrainLibrary=()=>drawLibrary().catch(console.error);
  parent.addEventListener("multisynth-pcm-library",onPcmLibrary);parent.addEventListener("multisynth-grain-library",onGrainLibrary);
  const onStateSync=event=>{
    const previous=state,next={...(def.defaults||{}),...(event.detail||{})};state=next;paintGlobal();
    const previousSelection=clamp(previous.selectedSample,0,SLOT_COUNT-1),currentSelection=selected(),selectionChanged=previousSelection!==currentSelection;
    const previousKey=previous.samples?.[currentSelection]?.pcmKey??null,currentKey=slotAt(currentSelection).pcmKey??null,keyChanged=String(previousKey??"")!==String(currentKey??"");
    const selectedSlotChanged=previous.samples?.[currentSelection]!==next.samples?.[currentSelection];
    if(selectionChanged)refreshSelection({redrawLibrary:true,rebind:true});
    else{
      if(selectedSlotChanged){paintSelectedParams();paintSteps();}
      if(previous.samples!==next.samples)paintSlots();
      if(keyChanged)drawLibrary().catch(console.error);
    }
  };
  window.addEventListener("multisynth-state-sync",onStateSync);

  let cleaned=false;
  function cleanup(){if(cleaned)return;cleaned=true;libraryToken++;parent.removeEventListener("multisynth-pcm-library",onPcmLibrary);parent.removeEventListener("multisynth-grain-library",onGrainLibrary);window.removeEventListener("multisynth-state-sync",onStateSync);}
  window.addEventListener("pagehide",cleanup,{once:true});window.addEventListener("unload",cleanup,{once:true});
})();
