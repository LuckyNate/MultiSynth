"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,D=MS.DspSources,T=MS.PatchTransport;
  if(!C||!I||!D||!T)return;

  const MIDI_BASE_NOTE=36,STEP_COUNT=32,VOICE_COUNT=16;
  const MIDI=Object.freeze({NOTE_OFF:0x80,NOTE_ON:0x90,CLOCK:0xf8,START:0xfa,CONTINUE:0xfb,STOP:0xfc});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),copy=v=>JSON.parse(JSON.stringify(v));
  const BASE=[
    {name:"SUB",kind:"sub",pitch:42,decay:1200,bend:-700,tone:28,character:65,level:88},
    {name:"KICK",kind:"kick",pitch:58,decay:520,bend:-1500,tone:52,character:72,level:92},
    {name:"SNARE",kind:"snare",pitch:190,decay:360,bend:-250,tone:68,character:72,level:80},
    {name:"TOM 1",kind:"tom",pitch:130,decay:720,bend:-380,tone:52,character:38,level:80},
    {name:"TOM 2",kind:"tom",pitch:205,decay:720,bend:-380,tone:52,character:38,level:80},
    {name:"TOM 3",kind:"tom",pitch:320,decay:720,bend:-380,tone:52,character:38,level:80},
    {name:"CRASH",kind:"crash",pitch:520,decay:1450,bend:0,tone:76,character:70,level:68},
    {name:"RIDE",kind:"ride",pitch:760,decay:1900,bend:0,tone:70,character:58,level:66},
    {name:"CHINA",kind:"china",pitch:620,decay:1250,bend:-120,tone:62,character:84,level:68},
    {name:"HAT CLOSED",kind:"hatc",pitch:1250,decay:90,bend:0,tone:88,character:65,level:62},
    {name:"HAT OPEN",kind:"hato",pitch:1250,decay:650,bend:0,tone:88,character:65,level:60},
    {name:"TAMBOURINE",kind:"tamb",pitch:900,decay:420,bend:0,tone:82,character:80,level:64},
    {name:"CLAP",kind:"clap",pitch:1100,decay:330,bend:0,tone:72,character:62,level:72},
    {name:"COWBELL",kind:"cowbell",pitch:587,decay:360,bend:0,tone:56,character:62,level:72},
    {name:"CLAVE",kind:"clave",pitch:1250,decay:70,bend:0,tone:66,character:45,level:74},
    {name:"RIMSHOT",kind:"rimshot",pitch:455,decay:85,bend:0,tone:78,character:72,level:74}
  ];
  const PARAMS=["pitch","decay","bend","tone","character","level"];
  const emptyStep=()=>({on:false,probability:100,velocity:100,micro:0,ratchet:1,fill:false,locks:{}});
  const emptyLane=i=>({length:32,mute:false,solo:false,voice:{...BASE[i]},steps:Array.from({length:STEP_COUNT},emptyStep)});
  const defaults=()=>({swing:0,steps:32,running:false,fill:false,selectedVoice:0,selectedStep:0,lockMode:false,lanes:Array.from({length:VOICE_COUNT},(_,i)=>emptyLane(i))});

  function normalizedState(saved={}){
    const base=defaults(),next={...base,...saved};
    next.swing=clamp(next.swing||0,0,100);next.steps=clamp(Math.round(next.steps||32),1,STEP_COUNT);next.running=next.running===true;next.fill=next.fill===true;next.lockMode=next.lockMode===true;next.selectedVoice=clamp(Math.round(next.selectedVoice||0),0,VOICE_COUNT-1);next.selectedStep=clamp(Math.round(next.selectedStep||0),0,STEP_COUNT-1);
    next.lanes=Array.from({length:VOICE_COUNT},(_,i)=>{const old=saved.lanes?.[i]||{},voice={...BASE[i],...(old.voice||{})};for(const key of PARAMS)voice[key]=Number.isFinite(Number(voice[key]))?Number(voice[key]):BASE[i][key];return{length:clamp(Math.round(old.length??32),1,STEP_COUNT),mute:!!old.mute,solo:!!old.solo,voice,steps:Array.from({length:STEP_COUNT},(_,s)=>{const x=old.steps?.[s]||{};return{on:!!x.on,probability:clamp(x.probability??100,0,100),velocity:clamp(Math.round(x.velocity??100),1,127),micro:clamp(x.micro??0,-50,50),ratchet:clamp(Math.round(x.ratchet??1),1,8),fill:!!x.fill,locks:Object.fromEntries(PARAMS.filter(k=>Number.isFinite(Number(x.locks?.[k]))).map(k=>[k,Number(x.locks[k])]))}})}});
    delete next.bpm;delete next.tick;return next;
  }
  function normalizeRuntimeState(state){const normalized=normalizedState(state);for(const key of Object.keys(state))delete state[key];Object.assign(state,normalized);return state;}

  const voiceFor=(u,i,st=null)=>{const lane=u.state.lanes[i],v={...BASE[i],...lane.voice};if(st?.locks)for(const k of PARAMS)if(Number.isFinite(Number(st.locks[k])))v[k]=Number(st.locks[k]);return v};
  function env(c,level,t,dur,peak=1){const g=c.createGain();g.gain.setValueAtTime(Math.max(.0001,level*peak),t);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.01,dur));return g}
  function osc(u,v,t,type="sine",amp=.7,bendScale=1,velocity=127){const dur=Math.max(.02,v.decay/1000),base=Math.max(10,v.pitch),o=D.oscillator(u.ctx,type,base),g=env(u.ctx,(v.level/100)*(velocity/127),t,dur,amp),bend=Number(v.bend||0)*bendScale,start=Math.max(10,base*Math.pow(2,-bend/1200));try{o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(base,t+Math.min(.12,dur*.32))}catch(_){}o.connect(g).connect(u.drums);o.start(t);o.stop(t+dur+.08)}
  function noise(u,v,t,amp=.3,type="highpass",freq=null,durScale=1,velocity=127){const dur=Math.max(.025,v.decay/1000*durScale),s=D.noise(u.ctx,"white",dur,false),f=u.ctx.createBiquadFilter(),g=env(u.ctx,(v.level/100)*(velocity/127),t,dur,amp);f.type=type;f.frequency.value=freq??(300+clamp(v.tone,0,100)/100*10500);f.Q.value=.5+clamp(v.character,0,100)/100*4;s.connect(f).connect(g).connect(u.drums);s.start(t);s.stop(t+dur)}
  function click(u,v,t,amp=.15,velocity=127){const d=Math.min(70,Math.max(12,v.decay*.15));noise(u,{...v,decay:d,tone:Math.min(100,v.tone+20)},t,amp,"highpass",1600+v.tone*55,.25,velocity)}
  function metal(u,v,t,ratios,velocity){for(let k=0;k<ratios.length;k++)osc(u,{...v,pitch:v.pitch*ratios[k],level:v.level*.55},t,k%2?"square":"triangle",.045,0,velocity);noise(u,v,t,.3,"highpass",1800+v.tone*70,1,velocity)}
  function hitSynth(u,i,t,st=null,velocity=127){const v=voiceFor(u,i,st),ch=clamp(v.character,0,100)/100,k=v.kind;
    if(k==="sub"){osc(u,v,t,"sine",.95,.7,velocity);if(ch>.55)osc(u,{...v,pitch:v.pitch*2,decay:v.decay*.35},t,"sine",.14,.2,velocity)}
    else if(k==="kick"){osc(u,v,t,"sine",1,1,velocity);click(u,v,t,.08+ch*.22,velocity)}
    else if(k==="snare"){osc(u,v,t,"triangle",.24,.25,velocity);noise(u,v,t,.25+ch*.48,"highpass",850+v.tone*65,1,velocity);click(u,v,t,.1,velocity)}
    else if(k==="tom"){osc(u,v,t,"sine",.78,.6,velocity);osc(u,{...v,pitch:v.pitch*1.48,decay:v.decay*.55,level:v.level*.55},t,"triangle",.16,.15,velocity)}
    else if(k==="crash"){metal(u,v,t,[1,1.342,1.731,2.117,2.693,3.417],velocity);noise(u,v,t,.5,"bandpass",3300+v.tone*52,.9,velocity)}
    else if(k==="ride"){metal(u,v,t,[1,1.48,1.93,2.56,3.21],velocity);noise(u,v,t,.3,"highpass",4200+v.tone*45,1,velocity);click(u,v,t,.18,velocity)}
    else if(k==="china"){metal(u,v,t,[.72,1,1.29,1.83,2.41,3.08],velocity);noise(u,v,t,.4,"bandpass",2200+v.tone*42,1,velocity)}
    else if(k==="hatc"||k==="hato"){metal(u,v,t,[1,1.342,1.731,2.117,2.693,3.417],velocity);noise(u,v,t,.34,"highpass",3900+v.tone*68,k==="hatc"?.55:1,velocity)}
    else if(k==="tamb"){metal(u,v,t,[1,1.57,2.23,3.11],velocity);noise(u,v,t,.25+ch*.2,"bandpass",2500+v.tone*70,.8,velocity)}
    else if(k==="clap"){for(let n=0;n<3;n++)noise(u,{...v,decay:40+ch*40},t+n*(.011+ch*.008),.28,"bandpass",1500+v.tone*20,.45,velocity);noise(u,v,t+.028,.24,"highpass",900+v.tone*22,1,velocity)}
    else if(k==="cowbell"){osc(u,v,t,"square",.4,0,velocity);osc(u,{...v,pitch:v.pitch*(1.38+ch*.12)},t,"square",.38,0,velocity)}
    else if(k==="clave"){osc(u,{...v,pitch:v.pitch*2,decay:Math.min(140,v.decay)},t,"triangle",.82,.05,velocity);click(u,v,t,.05,velocity)}
    else if(k==="rimshot"){osc(u,{...v,decay:Math.min(120,v.decay)},t,"triangle",.5,.05,velocity);osc(u,{...v,pitch:v.pitch*3.66,decay:Math.min(70,v.decay)},t,"triangle",.34,0,velocity);click(u,v,t,.16,velocity)}
  }
  function laneEnabled(state,i){const anySolo=state.lanes.some(x=>x.solo);return !state.lanes[i].mute&&(!anySolo||state.lanes[i].solo)}
  function receiveNote(runtime,status,note,velocity=0,time=runtime.ctx.currentTime,stepData=null){const n=Math.round(Number(note));if(!Number.isFinite(n))return false;const index=n-MIDI_BASE_NOTE;if(index<0||index>=VOICE_COUNT)return false;const kind=status&0xf0;if(kind===MIDI.NOTE_ON&&Number(velocity)>0){if(!laneEnabled(runtime.state,index))return true;hitSynth(runtime,index,time,stepData,clamp(velocity,1,127));return true}if(kind===MIDI.NOTE_OFF||(kind===MIDI.NOTE_ON&&Number(velocity)===0))return true;return false}
  function emitInternalNote(runtime,status,note,velocity,time,stepData=null){const packet={status,data:[status&255,note&127,velocity&127],time,source:I.TIME_BANDITS};runtime.emit?.("midi",packet);return receiveNote(runtime,status,note,velocity,time,stepData)}
  function releasePatternNotes(runtime,time){for(const note of runtime.patternNotes)emitInternalNote(runtime,MIDI.NOTE_OFF,note,0,time);runtime.patternNotes.clear()}
  function fireStep(runtime,step,time,sixteenth){releasePatternNotes(runtime,time);for(let index=0;index<VOICE_COUNT;index++){const lane=runtime.state.lanes[index];if(!laneEnabled(runtime.state,index))continue;const st=lane.steps[step%lane.length];if(!st?.on)continue;if(st.fill&&!runtime.state.fill)continue;if(Math.random()*100>=st.probability)continue;const velocity=clamp(st.velocity,1,127),micro=sixteenth*(st.micro/100),count=clamp(Math.round(st.ratchet||1),1,8),gap=sixteenth/count,note=MIDI_BASE_NOTE+index;for(let r=0;r<count;r++){const hitTime=Math.max(runtime.ctx.currentTime+.001,time+micro+r*gap);emitInternalNote(runtime,MIDI.NOTE_ON,note,velocity,hitTime,st)}runtime.patternNotes.add(note)}}
  function onTransportMidi(runtime,event={}){const status=Number(event.status)&255;if(status===MIDI.START){runtime.step=-1;runtime.transportRunning=true;releasePatternNotes(runtime,event.time??runtime.ctx.currentTime);return}if(status===MIDI.CONTINUE){runtime.transportRunning=true;return}if(status===MIDI.STOP){runtime.transportRunning=false;releasePatternNotes(runtime,event.time??runtime.ctx.currentTime)}}
  function onScheduledPulse(runtime,event={}){if(!runtime.transportRunning||!runtime.state.running)return;const pulse=Number(event.pulse)||0;if(!pulse||pulse%6!==0)return;runtime.step=(runtime.step+1)%clamp(runtime.state.steps,1,STEP_COUNT);const baseTime=Number.isFinite(Number(event.time))?Number(event.time):runtime.ctx.currentTime,sixteenth=60/Math.max(20,Number(event.bpm)||T.bpm||120)/4,swingDelay=(runtime.step%2===1)?sixteenth*.5*(clamp(runtime.state.swing,0,100)/100):0;fireStep(runtime,runtime.step,baseTime+swingDelay,sixteenth)}

  function create(api){normalizeRuntimeState(api.state);const ctx=api.context,input=ctx.createGain(),drums=ctx.createGain(),mix=ctx.createGain(),output=ctx.createGain();input.connect(mix);drums.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);const runtime={id:api.instanceId,ctx,input,drums,mix,output,state:api.state,emit:api.emit,transportRunning:T.running===true,step:-1,patternNotes:new Set(),unsubscribeMidi:null,unsubscribePulse:null};runtime.unsubscribeMidi=T.subscribeMidi(event=>onTransportMidi(runtime,event));runtime.unsubscribePulse=T.subscribeScheduledPulse(event=>onScheduledPulse(runtime,event));return runtime}
  function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;u.state=state;if(Object.prototype.hasOwnProperty.call(patch,"running")&&!state.running)releasePatternNotes(u,u.ctx.currentTime)}
  function noteOn({runtime},note,velocity=127){const u=runtime.user;return u?receiveNote(u,MIDI.NOTE_ON,note,velocity,u.ctx.currentTime):false}
  function noteOff({runtime},note){const u=runtime.user;return u?receiveNote(u,MIDI.NOTE_OFF,note,0,u.ctx.currentTime):false}
  function panic({runtime}){const u=runtime.user;if(!u)return false;releasePatternNotes(u,u.ctx.currentTime);return true}
  function destroy({runtime}){const u=runtime.user;if(!u)return;releasePatternNotes(u,u.ctx.currentTime);u.unsubscribeMidi?.();u.unsubscribePulse?.();for(const node of [u.input,u.drums,u.mix,u.output])try{node.disconnect()}catch(_){}}

  const surfaceDefaults=defaults();
  C.define({type:I.TIME_BANDITS,version:"time-bandits-5",description:"16-VOICE MIDI DRUM SYNTH · MIDI NOTES 36–51 · 32-STEP MIDI PATTERN SETTER · LOOKAHEAD-SCHEDULED SHARED MIDI REALTIME",defaults:surfaceDefaults,resources:["midi"],create,setState,noteOn,noteOff,panic,destroy,serialize:({state})=>normalizedState(state),restore:({saved})=>normalizedState(saved)});
  C.defineSurface(I.TIME_BANDITS,{version:5,package:{id:I.TIME_BANDITS,version:5,behavior:{role:"16-voice-midi-drum-pattern-setter",audioMode:"additive-pass-through",clockMode:"scheduled-shared-midi-realtime",midiNotes:"36-51-map-to-drum-voices",stateOwnership:"module"}},faceplate:{livery:"time-bandits",primary:"#24160f",secondary:"#d9a84f",tertiary:"#f4dfad"},defaults:surfaceDefaults,controls:[
    {id:"running",control:"switch",state:"running",label:"RUN PATTERN"},{id:"fill",control:"switch",state:"fill",label:"FILL"},{id:"swing",control:"knob",state:"swing",label:"SWING",value:{default:0,min:0,max:100,step:1},meta:{unit:"%"}},{id:"steps",control:"knob",state:"steps",label:"LENGTH",value:{default:32,min:1,max:32,step:1}},
    {id:"voice-pads",kind:"prefab",label:"16 DRUM PADS",controls:Array.from({length:VOICE_COUNT},(_,i)=>({id:`voice-${i}`,control:"pad",label:BASE[i].name,meta:{voiceIndex:i,midiNote:MIDI_BASE_NOTE+i}}))},{id:"step-grid",kind:"prefab",label:"32 STEPS",controls:Array.from({length:STEP_COUNT},(_,i)=>({id:`step-${i}`,control:"button",label:String(i+1),meta:{stepIndex:i,stateful:true}}))}
  ]});
})(window);
