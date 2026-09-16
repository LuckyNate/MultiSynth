"use strict";
(function(global){
  const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,S=MS.ModuleStandard,T=MS.PatchTransport;
  if(!C||!I||!S||!T)return;

  const SLOT_COUNT=16,STEP_COUNT=32,MIDI_BASE_NOTE=36;
  const MIDI=Object.freeze({NOTE_OFF:0x80,NOTE_ON:0x90,CLOCK:0xf8,START:0xfa,CONTINUE:0xfb,STOP:0xfc});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const emptySequence=()=>Array(STEP_COUNT).fill(0);
  const emptySlot=i=>({name:`SAMPLE ${String(i+1).padStart(2,"0")}`,pcmKey:null,start:0,end:0,pitch:0,level:1,stereo:0,locks:{},sequence:emptySequence()});
  const defaults=()=>({
    swing:0,steps:32,running:false,recording:false,recordSlot:0,selectedSample:0,previewPlaying:false,locks:{},
    samples:Array.from({length:SLOT_COUNT},(_,i)=>emptySlot(i))
  });

  function stepVelocity(value){if(value===true||Number(value)===1)return 127;return clamp(Math.round(Number(value)||0),0,127);}
  function normalizedState(saved={}){
    const base=defaults(),next={...base,...saved};
    next.samples=Array.from({length:SLOT_COUNT},(_,i)=>{
      const source=saved.samples?.[i]||{};
      const sequence=Array.from({length:STEP_COUNT},(_,step)=>stepVelocity(Array.isArray(source.sequence)?source.sequence[step]:0));
      return {...emptySlot(i),...source,stereo:clamp(source.stereo??0,-1,1),locks:{...(source.locks||{})},sequence};
    });
    next.locks={...(saved.locks||{})};
    next.selectedSample=clamp(next.selectedSample,0,SLOT_COUNT-1);
    next.recordSlot=clamp(next.recordSlot,0,SLOT_COUNT-1);
    next.steps=clamp(Math.round(next.steps||32),1,STEP_COUNT);
    next.swing=clamp(next.swing||0,0,100);
    next.running=next.running===true;
    next.recording=false;
    next.previewPlaying=false;
    delete next.bpm;delete next.stepsData;
    return next;
  }

  function normalizeRuntimeState(state){const normalized=normalizedState(state);for(const key of Object.keys(state))delete state[key];Object.assign(state,normalized);return state;}
  function installBuffer(runtime,index,data,sampleRate){index=clamp(index,0,SLOT_COUNT-1);return runtime.player.install(index,data,sampleRate);}
  function clearSlotBuffer(runtime,index){index=clamp(index,0,SLOT_COUNT-1);runtime.loadSerial[index]++;runtime.loadingKeys[index]=null;runtime.loadedKeys[index]=null;runtime.player.remove(index);}
  async function loadSlot(runtime,index,key){
    index=clamp(index,0,SLOT_COUNT-1);key=key==null?null:String(key);
    if(!key){clearSlotBuffer(runtime,index);return false;}if(runtime.loadedKeys[index]===key&&runtime.player.buffers.has(index))return true;if(runtime.loadingKeys[index]===key)return true;
    const library=MS.UnifiedLibrary||MS.PCMLibrary;if(!library?.get)return false;const serial=++runtime.loadSerial[index];runtime.loadingKeys[index]=key;
    try{const row=await library.get(key);if(serial!==runtime.loadSerial[index]||String(runtime.state.samples?.[index]?.pcmKey||"")!==key)return false;if(!row?.data?.length||!row.sampleRate)return false;const buffer=installBuffer(runtime,index,row.data,row.sampleRate);if(!buffer)return false;runtime.loadedKeys[index]=key;return true;}catch(error){console.error("Whitman Sampler sample load",error);return false;}finally{if(serial===runtime.loadSerial[index])runtime.loadingKeys[index]=null;}
  }
  function syncSampleBuffers(runtime){const samples=runtime.state.samples||[];for(let index=0;index<SLOT_COUNT;index++){const key=samples[index]?.pcmKey==null?null:String(samples[index].pcmKey);if(!key){if(runtime.loadedKeys[index]!==null||runtime.loadingKeys[index]!==null||runtime.player.buffers.has(index))clearSlotBuffer(runtime,index);continue;}if(runtime.loadedKeys[index]===key&&runtime.player.buffers.has(index))continue;if(runtime.loadingKeys[index]===key)continue;loadSlot(runtime,index,key);}}
  function hydrate(runtime){syncSampleBuffers(runtime);}

  function playbackSlot(source,velocity){const amount=clamp(Math.abs(Number(source.stereo)||0),0,1),right=(Number(source.stereo)||0)>0,quiet=1-.6*amount,lag=.025*amount;return {...source,level:Math.max(0,Number(source.level??1))*clamp(Number(velocity)||127,1,127)/127,leftLevel:right?quiet:1,rightLevel:right?1,lagMs:right?lag:-lag};}
  function play(runtime,index,time=runtime.ctx.currentTime,velocity=127){index=clamp(index,0,SLOT_COUNT-1);return runtime.player.play(index,playbackSlot(runtime.state.samples[index]||{},velocity),time);}
  function receiveNote(runtime,status,note,velocity=0,time=runtime.ctx.currentTime){const n=Math.round(Number(note));if(!Number.isFinite(n))return false;const index=n-MIDI_BASE_NOTE;if(index<0||index>=SLOT_COUNT)return false;const kind=status&0xf0;if(kind===MIDI.NOTE_ON&&Number(velocity)>0)return play(runtime,index,time,velocity);if(kind===MIDI.NOTE_OFF||(kind===MIDI.NOTE_ON&&Number(velocity)===0))return true;return false;}
  function emitInternalNote(runtime,status,note,velocity,time){const packet={status,data:[status&255,note&127,velocity&127],time,source:I.WHITMAN_SAMPLER};runtime.emit?.("midi",packet);return receiveNote(runtime,status,note,velocity,time);}
  function releasePatternNotes(runtime,time){for(const note of runtime.patternNotes)emitInternalNote(runtime,MIDI.NOTE_OFF,note,0,time);runtime.patternNotes.clear();}
  function fireStep(runtime,step,time){releasePatternNotes(runtime,time);for(let index=0;index<SLOT_COUNT;index++){const velocity=stepVelocity(runtime.state.samples?.[index]?.sequence?.[step]);if(!velocity)continue;const note=MIDI_BASE_NOTE+index;emitInternalNote(runtime,MIDI.NOTE_ON,note,velocity,time);runtime.patternNotes.add(note);}}

  function onTransportMidi(runtime,event={}){
    const status=Number(event.status)&255;
    if(status===MIDI.START){runtime.step=-1;runtime.transportRunning=true;releasePatternNotes(runtime,event.time??runtime.ctx.currentTime);return;}
    if(status===MIDI.CONTINUE){runtime.transportRunning=true;return;}
    if(status===MIDI.STOP){runtime.transportRunning=false;releasePatternNotes(runtime,event.time??runtime.ctx.currentTime);}
  }

  function onScheduledPulse(runtime,event={}){
    if(!runtime.transportRunning||!runtime.state.running)return;
    const pulse=Number(event.pulse)||0;
    if(!pulse||pulse%6!==0)return;
    runtime.step=(runtime.step+1)%clamp(runtime.state.steps,1,STEP_COUNT);
    const baseTime=Number.isFinite(Number(event.time))?Number(event.time):runtime.ctx.currentTime;
    const sixteenth=60/Math.max(20,Number(event.bpm)||T.bpm||120)/4;
    const swingDelay=(runtime.step%2===1)?sixteenth*.5*(clamp(runtime.state.swing,0,100)/100):0;
    fireStep(runtime,runtime.step,baseTime+swingDelay);
  }

  function stopPreview(runtime){if(runtime.previewTimer)clearTimeout(runtime.previewTimer);runtime.previewTimer=null;}
  function startPreview(runtime){stopPreview(runtime);const loop=()=>{if(!runtime.state.previewPlaying)return;const index=clamp(runtime.state.selectedSample,0,SLOT_COUNT-1),slot=runtime.state.samples[index],buffer=runtime.player.buffers.get(index);if(!slot||!buffer){runtime.previewTimer=setTimeout(loop,100);return;}play(runtime,index);const rate=Math.max(.01,Math.pow(2,(Number(slot.pitch)||0)/12)),start=Math.max(0,Number(slot.start)||0),end=Math.max(start+.001,Math.min(buffer.duration,Number(slot.end)||buffer.duration));runtime.previewTimer=setTimeout(loop,Math.max(10,(end-start)/rate*1000));};loop();}

  function create(api){
    normalizeRuntimeState(api.state);const ctx=api.context,input=ctx.createGain(),through=ctx.createGain(),samplerOut=ctx.createGain(),mix=ctx.createGain(),output=ctx.createGain();input.connect(through).connect(mix);samplerOut.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);
    const runtime={id:api.instanceId,ctx,input,through,samplerOut,mix,output,state:api.state,emit:api.emit,player:null,capture:null,previewTimer:null,transportRunning:T.running===true,step:-1,patternNotes:new Set(),unsubscribeMidi:null,unsubscribePulse:null,loadedKeys:Array(SLOT_COUNT).fill(null),loadingKeys:Array(SLOT_COUNT).fill(null),loadSerial:Array(SLOT_COUNT).fill(0)};
    runtime.player=S.sampler(ctx,samplerOut,{maxLag:.05});
    runtime.unsubscribeMidi=T.subscribeMidi(event=>onTransportMidi(runtime,event));
    runtime.unsubscribePulse=T.subscribeScheduledPulse(event=>onScheduledPulse(runtime,event));
    runtime.capture=S.capture(ctx,input,{onCapture:result=>{const slot=clamp(runtime.state.recordSlot??runtime.state.selectedSample,0,SLOT_COUNT-1);installBuffer(runtime,slot,result.pcm,result.sampleRate);runtime.loadedKeys[slot]=null;runtime.loadingKeys[slot]=null;runtime.emit?.("capture-ready",{index:slot,name:`INPUT ${String(slot+1).padStart(2,"0")}`,sampleRate:result.sampleRate,frames:result.pcm.length,duration:result.duration,source:I.WHITMAN_SAMPLER,pcmKey:null,transient:true});},onError:error=>console.error("Whitman Sampler input capture",error)});
    hydrate(runtime);if(api.state.recording)runtime.capture.start();if(api.state.previewPlaying)startPreview(runtime);return runtime;
  }
  function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;u.state=state;if(Array.isArray(patch.samples))syncSampleBuffers(u);if(Object.prototype.hasOwnProperty.call(patch,"recording"))(state.recording?u.capture.start():u.capture.stop());if(Object.prototype.hasOwnProperty.call(patch,"selectedSample")&&state.previewPlaying)startPreview(u);if(Object.prototype.hasOwnProperty.call(patch,"previewPlaying"))(state.previewPlaying?startPreview(u):stopPreview(u));if(Object.prototype.hasOwnProperty.call(patch,"running")&&!state.running)releasePatternNotes(u,u.ctx.currentTime);}
  function noteOn({runtime},note,velocity=127){const u=runtime.user;return u?receiveNote(u,MIDI.NOTE_ON,note,velocity,u.ctx.currentTime):false;}
  function noteOff({runtime},note){const u=runtime.user;return u?receiveNote(u,MIDI.NOTE_OFF,note,0,u.ctx.currentTime):false;}
  function destroy({runtime}){const u=runtime.user;if(!u)return;stopPreview(u);releasePatternNotes(u,u.ctx.currentTime);u.unsubscribeMidi?.();u.unsubscribePulse?.();for(let i=0;i<SLOT_COUNT;i++)u.loadSerial[i]++;u.capture?.destroy();u.player.stopAll();try{u.player.buffers?.clear?.();}catch(_){}for(const node of [u.input,u.through,u.samplerOut,u.mix,u.output])try{node.disconnect();}catch(_){}}

  C.define({type:I.WHITMAN_SAMPLER,version:10,description:"WHITMAN SAMPLER · 16 PCM SLOTS · MIDI NOTES 36–51 · 32-STEP MIDI PATTERN SETTER · LOOKAHEAD-SCHEDULED SHARED MIDI REALTIME",defaults:defaults(),resources:["pcm","storage","midi"],create,setState,noteOn,noteOff,destroy,serialize:({state})=>normalizedState(state),restore:({saved})=>normalizedState(saved)});
  C.defineSurface(I.WHITMAN_SAMPLER,{version:10,package:{id:I.WHITMAN_SAMPLER,version:10,behavior:{role:"16-slot-midi-sampler-pattern-setter",audioMode:"additive-pass-through",clockMode:"scheduled-shared-midi-realtime",midiNotes:"36-51-map-to-sample-slots",stateOwnership:"module"}},faceplate:{livery:"whitman-sampler",primary:"#3b2118",secondary:"#f1dfbd",tertiary:"#9d6a45"},defaults:defaults(),controls:[
    {id:"record",control:"button",state:"recording",label:"RECORD INPUT",meta:{momentary:true}},{id:"running",control:"switch",state:"running",label:"RUN PATTERN"},{id:"previewPlaying",control:"switch",state:"previewPlaying",label:"PLAY SELECTED"},
    {id:"swing",control:"knob",state:"swing",label:"SWING",value:{default:0,min:0,max:100,step:1},meta:{unit:"%"}},{id:"steps",control:"knob",state:"steps",label:"LENGTH",value:{default:32,min:1,max:32,step:1}},
    {id:"sample-slots",kind:"prefab",label:"16 SAMPLE PADS",controls:Array.from({length:SLOT_COUNT},(_,i)=>({id:`sample-${i}`,control:"pad",label:String(i+1).padStart(2,"0"),meta:{slotIndex:i,midiNote:MIDI_BASE_NOTE+i}}))},{id:"step-grid",kind:"prefab",label:"32 STEPS",controls:Array.from({length:STEP_COUNT},(_,i)=>({id:`step-${i}`,control:"button",label:String(i+1),meta:{stepIndex:i,stateful:true}}))},
    {id:"pitch",control:"knob",label:"PITCH",value:{default:0,min:-24,max:24,step:1},meta:{perSelectedSample:true,unit:" st"}},{id:"level",control:"knob",label:"LEVEL",value:{default:1,min:0,max:1,step:.01},meta:{perSelectedSample:true}},{id:"stereo",control:"fader",label:"STEREO",value:{default:0,min:-1,max:1,step:.01},meta:{perSelectedSample:true,bipolar:true}},{id:"library",control:"screen",label:"PCM LIBRARY",meta:{scroll:true}}
  ]});
})(window);
