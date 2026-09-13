"use strict";
(function(global){
  const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.ModuleStandard;
  if(!C||!I||!S)return;

  const SLOT_COUNT=16,STEP_COUNT=32;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const emptySlot=i=>({name:`SAMPLE ${String(i+1).padStart(2,"0")}`,pcmKey:null,start:0,end:0,pitch:0,level:1,leftLevel:1,rightLevel:1,lagMs:0,locks:{}});
  const defaults=()=>({
    bpm:120,swing:0,steps:32,running:false,recording:false,recordSlot:0,selectedSample:0,previewPlaying:false,cvTrigger:true,
    locks:{},samples:Array.from({length:SLOT_COUNT},(_,i)=>emptySlot(i)),stepsData:Array.from({length:STEP_COUNT},()=>[])
  });

  function normalizedState(saved={}){
    const base=defaults(),next={...base,...saved};
    next.samples=Array.from({length:SLOT_COUNT},(_,i)=>({...emptySlot(i),...(saved.samples?.[i]||{}),locks:{...(saved.samples?.[i]?.locks||{})}}));
    next.stepsData=Array.from({length:STEP_COUNT},(_,i)=>Array.isArray(saved.stepsData?.[i])?saved.stepsData[i].map(Number).filter(n=>n>=0&&n<SLOT_COUNT):[]);
    next.locks={...(saved.locks||{})};
    next.selectedSample=clamp(next.selectedSample,0,SLOT_COUNT-1);
    next.recordSlot=clamp(next.recordSlot,0,SLOT_COUNT-1);
    next.steps=clamp(Math.round(next.steps||32),1,STEP_COUNT);
    next.bpm=clamp(next.bpm||120,30,300);
    next.swing=clamp(next.swing||0,0,100);
    next.recording=false;
    next.previewPlaying=false;
    return next;
  }

  function installBuffer(runtime,index,data,sampleRate){index=clamp(index,0,SLOT_COUNT-1);return runtime.player.install(index,data,sampleRate);}
  function clearSlotBuffer(runtime,index){index=clamp(index,0,SLOT_COUNT-1);runtime.loadSerial[index]++;runtime.loadingKeys[index]=null;runtime.loadedKeys[index]=null;runtime.player.remove(index);}

  async function loadSlot(runtime,index,key){
    index=clamp(index,0,SLOT_COUNT-1);key=key==null?null:String(key);
    if(!key){clearSlotBuffer(runtime,index);return false;}
    if(runtime.loadedKeys[index]===key&&runtime.player.buffers.has(index))return true;
    if(runtime.loadingKeys[index]===key)return true;
    const library=MS.UnifiedLibrary||MS.PCMLibrary;if(!library?.get)return false;
    const serial=++runtime.loadSerial[index];runtime.loadingKeys[index]=key;
    try{
      const row=await library.get(key);
      if(serial!==runtime.loadSerial[index]||String(runtime.state.samples?.[index]?.pcmKey||"")!==key)return false;
      if(!row?.data?.length||!row.sampleRate)return false;
      const buffer=installBuffer(runtime,index,row.data,row.sampleRate);if(!buffer)return false;
      runtime.loadedKeys[index]=key;return true;
    }catch(error){console.error("Whitman Sampler sample load",error);return false;}
    finally{if(serial===runtime.loadSerial[index])runtime.loadingKeys[index]=null;}
  }

  function syncSampleBuffers(runtime){
    const samples=runtime.state.samples||[];
    for(let index=0;index<SLOT_COUNT;index++){
      const key=samples[index]?.pcmKey==null?null:String(samples[index].pcmKey);
      if(!key){if(runtime.loadedKeys[index]!==null||runtime.loadingKeys[index]!==null||runtime.player.buffers.has(index))clearSlotBuffer(runtime,index);continue;}
      if(runtime.loadedKeys[index]===key&&runtime.player.buffers.has(index))continue;
      if(runtime.loadingKeys[index]===key)continue;
      loadSlot(runtime,index,key);
    }
  }
  function hydrate(runtime){syncSampleBuffers(runtime);}

  function play(runtime,index,time=runtime.ctx.currentTime){index=clamp(index,0,SLOT_COUNT-1);return runtime.player.play(index,runtime.state.samples[index]||{},time);}
  function fireStep(runtime,step,time){for(const index of runtime.state.stepsData?.[step]||[])play(runtime,index,time);}

  function stopPreview(runtime){if(runtime.previewTimer)clearTimeout(runtime.previewTimer);runtime.previewTimer=null;}
  function startPreview(runtime){
    stopPreview(runtime);
    const loop=()=>{
      if(!runtime.state.previewPlaying)return;
      const index=clamp(runtime.state.selectedSample,0,SLOT_COUNT-1),slot=runtime.state.samples[index],buffer=runtime.player.buffers.get(index);
      if(!slot||!buffer){runtime.previewTimer=setTimeout(loop,100);return;}
      play(runtime,index);
      const rate=Math.max(.01,Math.pow(2,(Number(slot.pitch)||0)/12)),start=Math.max(0,Number(slot.start)||0),end=Math.max(start+.001,Math.min(buffer.duration,Number(slot.end)||buffer.duration));
      runtime.previewTimer=setTimeout(loop,Math.max(10,(end-start)/rate*1000));
    };
    loop();
  }

  function create(api){
    const ctx=api.context,input=ctx.createGain(),through=ctx.createGain(),samplerOut=ctx.createGain(),mix=ctx.createGain(),output=ctx.createGain();
    input.connect(through).connect(mix);samplerOut.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);
    const runtime={id:api.instanceId,ctx,input,through,samplerOut,mix,output,state:api.state,emit:api.emit,player:null,transport:null,capture:null,previewTimer:null,cvStep:0,loadedKeys:Array(SLOT_COUNT).fill(null),loadingKeys:Array(SLOT_COUNT).fill(null),loadSerial:Array(SLOT_COUNT).fill(0)};
    runtime.player=S.sampler(ctx,samplerOut,{maxLag:.05});
    runtime.transport=S.transport(ctx,{getState:()=>runtime.state,maxSteps:STEP_COUNT,onStep:(step,time,meta)=>{
      fireStep(runtime,step,time);
      if(!meta?.external&&step%4===0)MS.CvBus?.send(runtime.id,{kind:"trigger",clock:true,value:1,gate:true,bpm:Number(runtime.state.bpm)||120,substep:step,beat:Math.floor(step/4),time});
    }});
    runtime.capture=S.capture(ctx,input,{onCapture:result=>{
      const slot=clamp(runtime.state.recordSlot??runtime.state.selectedSample,0,SLOT_COUNT-1);
      installBuffer(runtime,slot,result.pcm,result.sampleRate);runtime.loadedKeys[slot]=null;runtime.loadingKeys[slot]=null;
      runtime.emit?.("capture-ready",{index:slot,name:`INPUT ${String(slot+1).padStart(2,"0")}`,sampleRate:result.sampleRate,frames:result.pcm.length,duration:result.duration,source:I.WHITMAN_SAMPLER,pcmKey:null,transient:true});
    },onError:error=>console.error("Whitman Sampler input capture",error)});
    hydrate(runtime);
    if(api.state.running)runtime.transport.start();if(api.state.recording)runtime.capture.start();if(api.state.previewPlaying)startPreview(runtime);
    return runtime;
  }

  function setState({runtime,state,patch}){
    const u=runtime.user;if(!u)return;u.state=state;
    if(Array.isArray(patch.samples))syncSampleBuffers(u);
    if(Object.prototype.hasOwnProperty.call(patch,"running"))(state.running?u.transport.start():u.transport.stop());
    if(Object.prototype.hasOwnProperty.call(patch,"recording"))(state.recording?u.capture.start():u.capture.stop());
    if(Object.prototype.hasOwnProperty.call(patch,"selectedSample")&&state.previewPlaying)startPreview(u);
    if(Object.prototype.hasOwnProperty.call(patch,"previewPlaying"))(state.previewPlaying?startPreview(u):stopPreview(u));
  }

  function trigger({runtime,state},packet={}){
    const u=runtime.user;if(!u?.ctx)return false;
    if(packet.sampleIndex!==undefined&&packet.sampleIndex!==null)return play(u,packet.sampleIndex,Number(packet.time)||u.ctx.currentTime);
    if(!state.cvTrigger)return true;
    const length=clamp(Math.round(state.steps||32),1,STEP_COUNT),start=u.cvStep%length,base=Number(packet.time)||u.ctx.currentTime,sixteenth=60/clamp(state.bpm||120,30,300)/4;
    for(let n=0;n<4;n++)fireStep(u,(start+n)%length,base+n*sixteenth);
    u.cvStep=(start+4)%length;return true;
  }
  function clockStart({runtime}){const u=runtime.user;if(u)u.cvStep=0;u?.transport.clockStart();}
  function clockStop({runtime}){runtime.user?.transport.clockStop();}
  function clockTick({runtime},tick){return runtime.user?.transport.clockTick(tick)??false;}
  function destroy({runtime}){const u=runtime.user;if(!u)return;stopPreview(u);for(let i=0;i<SLOT_COUNT;i++)u.loadSerial[i]++;u.transport.destroy();u.capture?.destroy();u.player.stopAll();try{u.player.buffers?.clear?.();}catch(_){}for(const node of [u.input,u.through,u.samplerOut,u.mix,u.output])try{node.disconnect();}catch(_){}}

  C.define({type:I.WHITMAN_SAMPLER,version:4,description:"WHITMAN SAMPLER · 16 PCM SLOTS · 32 STEP MULTI-SAMPLE SEQUENCER",defaults:defaults(),resources:["pcm","storage"],create,setState,trigger,clockStart,clockStop,clockTick,destroy,serialize:({state})=>normalizedState(state),restore:({saved})=>normalizedState(saved)});
  C.defineSurface(I.WHITMAN_SAMPLER,{version:4,package:{id:I.WHITMAN_SAMPLER,version:4,behavior:{role:"16-slot-32-step-pcm-sampler",audioMode:"additive-pass-through",clockMode:"internal-or-follower",cvMode:"quarter-note-trigger",stateOwnership:"module"}},faceplate:{livery:"whitman-sampler",primary:"#3b2118",secondary:"#f1dfbd",tertiary:"#9d6a45"},defaults:defaults(),controls:[
    {id:"record",control:"button",state:"recording",label:"RECORD INPUT",meta:{momentary:true}},{id:"running",control:"switch",state:"running",label:"RUN"},{id:"previewPlaying",control:"switch",state:"previewPlaying",label:"PLAY SELECTED"},{id:"cvTrigger",control:"switch",state:"cvTrigger",label:"CV TRIGGER"},
    {id:"bpm",control:"knob",state:"bpm",label:"BPM",value:{default:120,min:30,max:300,step:1}},{id:"swing",control:"knob",state:"swing",label:"SWING",value:{default:0,min:0,max:100,step:1},meta:{unit:"%"}},{id:"steps",control:"knob",state:"steps",label:"LENGTH",value:{default:32,min:1,max:32,step:1}},
    {id:"sample-slots",kind:"prefab",label:"16 SAMPLE PADS",controls:Array.from({length:SLOT_COUNT},(_,i)=>({id:`sample-${i}`,control:"pad",label:String(i+1).padStart(2,"0"),meta:{slotIndex:i}}))},{id:"step-grid",kind:"prefab",label:"32 STEPS",controls:Array.from({length:STEP_COUNT},(_,i)=>({id:`step-${i}`,control:"button",label:String(i+1),meta:{stepIndex:i,stateful:true}}))},
    {id:"pitch",control:"knob",label:"PITCH",value:{default:0,min:-24,max:24,step:1},meta:{perSelectedSample:true,unit:" st"}},{id:"level",control:"knob",label:"LEVEL",value:{default:1,min:0,max:1,step:.01},meta:{perSelectedSample:true}},{id:"leftLevel",control:"knob",label:"LEFT",value:{default:1,min:0,max:1,step:.01},meta:{perSelectedSample:true}},{id:"rightLevel",control:"knob",label:"RIGHT",value:{default:1,min:0,max:1,step:.01},meta:{perSelectedSample:true}},{id:"lagMs",control:"knob",label:"L/R LAG",value:{default:0,min:-.05,max:.05,step:.001},meta:{perSelectedSample:true,unit:" s"}},{id:"library",control:"screen",label:"PCM LIBRARY",meta:{scroll:true}}
  ]});
})(window);
