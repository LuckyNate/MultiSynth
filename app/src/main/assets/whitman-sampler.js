"use strict";
(()=>{
  const query=new URLSearchParams(location.search),instance=query.get("instance"),Host=parent.MultiSynth||{},Engine=Host.NodeGraphEngine,Contract=Host.ModuleContract,Renderer=window.MultiSynth?.ControlSurfaceRenderer,Library=Host.UnifiedLibrary||Host.PCMLibrary,root=document.getElementById("controls");
  if(!instance||!Engine||!Contract||!Renderer||!root)throw new Error("WHITMAN SAMPLER EDITOR UNAVAILABLE");
  const module=Engine.getModule(instance);if(!module)throw new Error("WHITMAN SAMPLER INSTANCE NOT FOUND");
  const def=Contract.getDefinition(module.type),surface=Contract.getSurface(module.type);let state={...(def.defaults||{}),...(module.state||{})};
  const SLOT_COUNT=16,STEP_COUNT=32,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),copy=v=>JSON.parse(JSON.stringify(v));
  root.innerHTML="";root.classList.add("ms-module-surface");

  function bank(title,layout){const section=document.createElement("section");section.className="ms-module-bank";const heading=document.createElement("div");heading.className="ms-module-bank-title";heading.textContent=title;const grid=document.createElement("div");grid.className=`ms-control-grid ${layout}`;section.append(heading,grid);root.appendChild(section);return grid;}
  const mount=(parent,descriptor,visual={})=>Renderer.mount(parent,{...descriptor,meta:{...(descriptor.meta||{}),visual:{...(descriptor.meta?.visual||{}),...visual}}});
  const send=patch=>Engine.setModuleState(instance,patch);
  const slotAt=index=>state.samples?.[clamp(index,0,SLOT_COUNT-1)]||{};
  const selected=()=>clamp(state.selectedSample,0,SLOT_COUNT-1);
  function replaceSlot(index,mutate){const samples=copy(state.samples||[]);while(samples.length<SLOT_COUNT)samples.push({});const next={...(samples[index]||{}),locks:{...(samples[index]?.locks||{})}};mutate(next);samples[index]=next;send({samples});}

  const transport=bank("TRANSPORT","ms-layout-transport"),timing=bank("TIMING","ms-layout-knobs"),slots=bank("16 SAMPLE PADS","ms-layout-steps"),params=bank("SELECTED SAMPLE","ms-layout-params"),steps=bank("32 STEPS","ms-layout-steps"),libraryBank=bank("PCM LIBRARY","ms-layout-list");

  const record=mount(transport,{id:"record",control:"button",label:"RECORD INPUT"},{variant:"rect"});
  record.addEventListener("multisynth-control-button-press",()=>send({recording:true,recordSlot:selected()}));
  record.addEventListener("multisynth-control-button-release",()=>send({recording:false}));

  function switchControl(id,label,key){const node=mount(transport,{id,control:"switch",state:key,label},{variant:"rocker"});node.addEventListener("multisynth-control-switch-change",event=>send({[key]:!!event.detail?.on}));node.commitSwitchState?.(!!state[key],{silent:true});return node;}
  const runSwitch=switchControl("running","RUN","running"),previewSwitch=switchControl("previewPlaying","PLAY SELECTED","previewPlaying"),cvSwitch=switchControl("cvTrigger","CV TRIGGER","cvTrigger");

  const globalKnobs=new Map();
  function bindGlobalKnob(id,label,key,min,max,step,unit=""){
    const node=mount(timing,{id,control:"knob",state:key,label,value:{default:Number(state[key]??min),min,max,step},meta:{unit}},{variant:"cap",valueReadout:true}),binding={key:`whitman.${key}`,get value(){return Number(state[key]??min)},set value(v){send({[key]:v})},get locked(){return !!state.locks?.[key]},set locked(v){send({locks:{...(state.locks||{}),[key]:!!v}})}};
    Renderer.bindKnob(node,binding);globalKnobs.set(key,node);return node;
  }
  bindGlobalKnob("bpm","BPM","bpm",30,300,1," BPM");bindGlobalKnob("swing","SWING","swing",0,100,1,"%");bindGlobalKnob("length","LENGTH","steps",1,32,1,"");

  const slotNodes=[];
  for(let index=0;index<SLOT_COUNT;index++){
    const node=mount(slots,{id:`sample-${index}`,control:"pad",label:String(index+1).padStart(2,"0")},{variant:"square"});node.classList.add("whitman-slot");node.dataset.slot=String(index);node.addEventListener("multisynth-control-pad-tap",()=>send({selectedSample:index,recordSlot:index}));slotNodes.push(node);
  }

  const paramNodes=new Map();
  const paramSpecs={pitch:{label:"PITCH",min:-24,max:24,step:1,unit:" st"},level:{label:"LEVEL",min:0,max:1,step:.01,unit:""},leftLevel:{label:"LEFT",min:0,max:1,step:.01,unit:""},rightLevel:{label:"RIGHT",min:0,max:1,step:.01,unit:""},lagMs:{label:"L/R LAG",min:-.05,max:.05,step:.001,unit:" s"}};
  function bindSampleParam(key){
    const spec=paramSpecs[key],index=selected(),slot=slotAt(index),node=paramNodes.get(key)||mount(params,{id:key,control:"knob",label:spec.label,value:{default:Number(slot[key]??0),min:spec.min,max:spec.max,step:spec.step},meta:{unit:spec.unit}},{variant:"cap",valueReadout:true});if(!paramNodes.has(key))paramNodes.set(key,node);
    const binding={key:`whitman.sample.${index}.${key}`,get value(){return Number(slotAt(index)[key]??0)},set value(v){replaceSlot(index,target=>{target[key]=v})},get locked(){return !!slotAt(index).locks?.[key]},set locked(v){replaceSlot(index,target=>{target.locks={...(target.locks||{}),[key]:!!v}})}};
    node.dataset.bindingKey=binding.key;Renderer.bindKnob(node,binding);node.setModuleValue?.(binding.value);node.setControlLocked?.(binding.locked,{silent:true});
  }
  Object.keys(paramSpecs).forEach(bindSampleParam);

  const stepNodes=[];
  for(let index=0;index<STEP_COUNT;index++){
    const node=mount(steps,{id:`step-${index}`,control:"button",label:String(index+1)},{variant:"rect"});node.addEventListener("multisynth-control-button-tap",()=>{const sample=selected(),data=copy(state.stepsData||[]);while(data.length<STEP_COUNT)data.push([]);const row=(data[index]||[]).map(Number),at=row.indexOf(sample);if(at>=0)row.splice(at,1);else row.push(sample);data[index]=row;send({stepsData:data});});stepNodes.push(node);
  }

  const screen=mount(libraryBank,{id:"library",control:"screen",label:"SAVED SAMPLES"},{variant:"scroll",height:260}),screenFace=screen.querySelector(".ms-control-face");let libraryList=document.createElement("div"),libraryToken=0;libraryList.className="whitman-library-list";screenFace?.appendChild(libraryList);
  async function installPCM(id,index=selected()){
    if(!Library?.get)return;const full=await Library.get(id);if(!full)return;const samples=copy(state.samples||[]);while(samples.length<SLOT_COUNT)samples.push({});samples[index]={...(samples[index]||{}),name:full.name,pcmKey:full.id,start:0,end:full.duration,pitch:samples[index]?.pitch??0,level:samples[index]?.level??1,leftLevel:samples[index]?.leftLevel??1,rightLevel:samples[index]?.rightLevel??1,lagMs:samples[index]?.lagMs??0,locks:{...(samples[index]?.locks||{})}};send({samples,pcmInstall:{index,data:full.data,sampleRate:full.sampleRate,name:full.name,pcmKey:full.id}});
  }
  async function drawLibrary(){
    const token=++libraryToken,chosen=selected(),chosenKey=slotAt(chosen).pcmKey||null,scroll=screenFace?.scrollTop||0,next=document.createElement("div");next.className="whitman-library-list";const items=Library?.list?await Library.list():[];if(token!==libraryToken)return;let activeRow=null;
    if(!items.length){const empty=document.createElement("div");empty.className="whitman-library-empty";empty.textContent="NO SAVED SAMPLES";next.appendChild(empty);}else for(const item of items){const full=Library?.get?await Library.get(item.id):null;if(token!==libraryToken)return;const row=document.createElement("div");row.className="ms-list-row whitman-library-row";if(chosenKey!=null&&String(item.id)===String(chosenKey)){row.dataset.selected="1";activeRow=row;}next.appendChild(row);const choice=Renderer.mountLibraryChoice(row,{id:`use-${item.id}`,label:`${item.name} · ${(item.duration||0).toFixed(2)}s`,data:full?.data,sampleRate:full?.sampleRate||item.sampleRate,active:chosenKey!=null&&String(item.id)===String(chosenKey),onSelect:()=>installPCM(item.id,chosen).catch(console.error)});choice.dataset.bindingKey=`whitman.sample.${chosen}.pcm`;}
    if(token!==libraryToken)return;libraryList.replaceWith(next);libraryList=next;if(screenFace){screenFace.scrollTop=Math.min(scroll,Math.max(0,screenFace.scrollHeight-screenFace.clientHeight));if(activeRow)requestAnimationFrame(()=>{if(token!==libraryToken||!activeRow.isConnected)return;const top=activeRow.offsetTop,bottom=top+activeRow.offsetHeight,viewTop=screenFace.scrollTop,viewBottom=viewTop+screenFace.clientHeight;if(top<viewTop)screenFace.scrollTop=top;else if(bottom>viewBottom)screenFace.scrollTop=Math.max(0,bottom-screenFace.clientHeight);});}
  }

  function paintSlots(){const current=selected();slotNodes.forEach((node,index)=>{node.dataset.selected=index===current?"1":"0";node.dataset.loaded=slotAt(index).pcmKey?"1":"0";const label=node.querySelector(".ms-control-label");if(label)label.textContent=String(index+1).padStart(2,"0");});}
  function paintSteps(){const sample=selected();stepNodes.forEach((node,index)=>node.commitButtonState?.((state.stepsData?.[index]||[]).map(Number).includes(sample),{silent:true}));}
  function rebindSelected(){Object.keys(paramSpecs).forEach(bindSampleParam);paintSlots();paintSteps();drawLibrary().catch(console.error);}
  function paintGlobal(){runSwitch.commitSwitchState?.(!!state.running,{silent:true});previewSwitch.commitSwitchState?.(!!state.previewPlaying,{silent:true});cvSwitch.commitSwitchState?.(!!state.cvTrigger,{silent:true});record.commitButtonState?.(!!state.recording,{silent:true});for(const [key,node] of globalKnobs){node.setModuleValue?.(state[key]);node.setControlLocked?.(!!state.locks?.[key],{silent:true});}}

  paintGlobal();rebindSelected();
  parent.addEventListener("multisynth-pcm-library",()=>drawLibrary().catch(console.error));
  parent.addEventListener("multisynth-grain-library",()=>drawLibrary().catch(console.error));
  window.addEventListener("multisynth-state-sync",event=>{const before=state;state={...(def.defaults||{}),...(event.detail||{})};paintGlobal();const selectionChanged=Number(before.selectedSample)!==Number(state.selectedSample),samplesChanged=before.samples!==state.samples,stepsChanged=before.stepsData!==state.stepsData;if(selectionChanged||samplesChanged)rebindSelected();else if(stepsChanged)paintSteps();if(samplesChanged&&!selectionChanged)drawLibrary().catch(console.error);});
})();
