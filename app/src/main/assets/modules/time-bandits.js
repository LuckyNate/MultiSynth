"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,D=MS.DspSources,T=MS.PatchTransport;
  if(!C||!I||!D||!T)return;

  const MIDI_BASE=36,STEPS=32,VOICES=16;
  const MIDI=Object.freeze({CLOCK:0xf8,START:0xfa,CONTINUE:0xfb,STOP:0xfc});
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
  const step=()=>({on:false,probability:100,velocity:100,micro:0,ratchet:1,fill:false,locks:{}});
  const lane=i=>({length:32,mute:false,solo:false,voice:{...BASE[i]},steps:Array.from({length:STEPS},step)});
  const defaults=()=>({swing:0,running:false,fill:false,selectedVoice:0,selectedStep:0,lockMode:false,lanes:Array.from({length:VOICES},(_,i)=>lane(i))});

  function normalize(state){
    delete state.bpm;delete state.tick;
    state.swing=clamp(state.swing??0,0,100);state.running=!!state.running;state.fill=!!state.fill;state.lockMode=!!state.lockMode;state.selectedVoice=clamp(Math.round(state.selectedVoice||0),0,VOICES-1);state.selectedStep=clamp(Math.round(state.selectedStep||0),0,STEPS-1);
    const src=Array.isArray(state.lanes)?state.lanes:[];
    state.lanes=Array.from({length:VOICES},(_,i)=>{const old=src[i]||{},v={...BASE[i],...(old.voice||{})};for(const k of PARAMS)v[k]=Number.isFinite(Number(v[k]))?Number(v[k]):BASE[i][k];return{length:clamp(Math.round(old.length??32),1,32),mute:!!old.mute,solo:!!old.solo,voice:v,steps:Array.from({length:STEPS},(_,s)=>{const x=old.steps?.[s]||{};return{on:!!x.on,probability:clamp(x.probability??100,0,100),velocity:clamp(x.velocity??100,1,127),micro:clamp(x.micro??0,-50,50),ratchet:clamp(Math.round(x.ratchet??1),1,8),fill:!!x.fill,locks:Object.fromEntries(PARAMS.filter(k=>Number.isFinite(Number(x.locks?.[k]))).map(k=>[k,Number(x.locks[k])]))}})}});
    return state;
  }
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
  function fireStep(u,packet){
    if(!u.transportRunning||!u.state.running)return;
    const pulse=Number(packet?.pulse)||0;if(!pulse||pulse%6!==0)return;
    u.step=(u.step+1)%STEPS;
    const stepDur=60/Math.max(20,Number(packet?.bpm)||T.bpm||120)/4,odd=u.step%2===1,swingDelay=odd?stepDur*.5*(u.state.swing/100):0;
    for(let i=0;i<VOICES;i++){const lane=u.state.lanes[i];if(!laneEnabled(u.state,i))continue;const s=lane.steps[u.step%lane.length];if(!s?.on)continue;if(s.fill&&!u.state.fill)continue;if(Math.random()*100>=s.probability)continue;const micro=stepDur*(s.micro/100),base=Math.max(u.ctx.currentTime+.001,(Number(packet.time)||u.ctx.currentTime)+swingDelay+micro),count=s.ratchet,gap=stepDur/count,vel=clamp(s.velocity,1,127);for(let r=0;r<count;r++)hitSynth(u,i,base+r*gap,s,vel)}
  }
  function onTransportMidi(u,event={}){const status=Number(event.status)&255;if(status===MIDI.START){u.step=-1;u.transportRunning=true;return}if(status===MIDI.CONTINUE){u.transportRunning=true;return}if(status===MIDI.STOP)u.transportRunning=false}
  function create(api){const c=api.context,input=c.createGain(),drums=c.createGain(),mix=c.createGain(),output=c.createGain();normalize(api.state);input.connect(mix);drums.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);const u={ctx:c,input,drums,mix,output,state:api.state,transportRunning:T.running===true,step:-1,unsubscribeMidi:null,unsubscribePulse:null};u.unsubscribeMidi=T.subscribeMidi(e=>onTransportMidi(u,e));u.unsubscribePulse=T.subscribeScheduledPulse(e=>fireStep(u,e));return u}
  function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;normalize(state);u.state=state;if("running" in patch&&state.running)u.step=-1}
  function noteOn({runtime},note,velocity=127){const u=runtime.user,i=Math.round(Number(note))-MIDI_BASE;if(!u||i<0||i>=VOICES)return false;if(!laneEnabled(u.state,i))return true;hitSynth(u,i,u.ctx.currentTime+.002,null,clamp(velocity,1,127));return true}
  function noteOff(){return true}
  function panic(){return true}
  function destroy({runtime}){const u=runtime.user;if(!u)return;u.unsubscribeMidi?.();u.unsubscribePulse?.();for(const n of[u.input,u.drums,u.mix,u.output])try{n.disconnect()}catch(_){}}

  const surfaceDefaults=defaults();
  C.define({type:I.TIME_BANDITS,version:"time-bandits-4",description:"16-VOICE MIDI DRUM SYNTH · 32-STEP WHITMAN-STYLE SCHEDULED MIDI PATTERN ENGINE · PER-STEP PROBABILITY / VELOCITY / MICROTIMING / RATCHET / PARAMETER LOCKS · MIDI NOTES 36–51",defaults:surfaceDefaults,resources:["midi"],create,setState,noteOn,noteOff,panic,destroy,serialize:({state})=>copy(state),restore:({saved})=>normalize({...defaults(),...(saved||{})})});
  C.defineSurface(I.TIME_BANDITS,{version:4,package:{id:I.TIME_BANDITS,version:4,behavior:{role:"midi-drum-machine",steps:32,voices:16,clockMode:"scheduled-shared-midi-realtime",patternTiming:"whitman-compatible-6-f8-sixteenth",probability:"per-step",stateOwnership:"module"}},faceplate:{livery:"time-bandits",primary:"#24160f",secondary:"#d9a84f",tertiary:"#f4dfad"},defaults:surfaceDefaults,controls:[]});

  if(global.parent===global)return;
  const q=new URLSearchParams(global.location.search),instance=q.get("instance"),P=global.parent.MultiSynth||{},E=P.NodeGraphEngine,MC=P.ModuleContract,R=MS.ControlSurfaceRenderer,K=MS.ControlSurface?.CONTROL,root=document.getElementById("controls");
  if(!instance||!E||!MC||!R||!K||!root)return;
  const module=E.getModule(instance),model=MC.getSurface(I.TIME_BANDITS);if(!module||!model)return;let state=normalize({...model.defaults,...(module.state||{})});
  const send=patch=>E.setModuleState(instance,patch),mount=(p,d,v={})=>R.mount(p,{...d,meta:{...(d.meta||{}),visual:{...(d.meta?.visual||{}),...v}}}),bank=(title,layout)=>{const s=document.createElement("section"),h=document.createElement("div"),g=document.createElement("div");s.className="ms-module-bank";h.className="ms-module-bank-title";h.textContent=title;g.className=`ms-control-grid ${layout}`;s.append(h,g);root.appendChild(s);return g};
  root.innerHTML="";root.classList.add("ms-module-surface");const scope=document.getElementById("timeBanditsSharedScope");if(scope)root.appendChild(scope.content.cloneNode(true));
  const transport=bank("TRANSPORT","ms-layout-transport"),voices=bank("VOICE","ms-layout-pads tb-voice-grid"),steps=bank("32 STEPS","ms-layout-steps"),laneControls=bank("TRACK","ms-layout-params"),stepControls=bank("SELECTED STEP","ms-layout-params"),synthControls=bank("SYNTH / PARAM LOCKS","ms-layout-params");
  const nodes={};
  const bindKnob=(node,get,set,min,max,step=1)=>{const b={get value(){return get()},set value(v){set(v)},get locked(){return false},set locked(v){}};R.bindKnob(node,b);node.setModuleValue?.(get());return b};
  const run=mount(transport,{id:"running",control:"switch",label:"RUN"},{variant:"vertical"});run.addEventListener("multisynth-control-switch-change",e=>send({running:!!e.detail?.on}));
  const swing=mount(transport,{id:"swing",control:"knob",label:"SWING",value:{default:0,min:0,max:100,step:1},meta:{unit:"%"}},{variant:"cap",valueReadout:true});bindKnob(swing,()=>state.swing,v=>send({swing:clamp(v,0,100)}),0,100,1);
  const fill=mount(transport,{id:"fill",control:"switch",label:"FILL"},{variant:"rocker"});fill.addEventListener("multisynth-control-switch-change",e=>send({fill:!!e.detail?.on}));
  const voiceNodes=[];BASE.forEach((v,i)=>{const n=mount(voices,{id:`voice-${i}`,control:"pad",label:v.name},{variant:"square"});const face=n.querySelector(".ms-control-face");if(face){const t=document.createElement("span");t.className="tb-voice-face-label";t.textContent=v.name;face.appendChild(t)}n.addEventListener("multisynth-control-pad-tap",()=>{send({selectedVoice:i});P.ModuleContract?.noteOn?.(instance,MIDI_BASE+i,110)});voiceNodes.push(n)});
  const stepNodes=[];for(let i=0;i<STEPS;i++){const n=mount(steps,{id:`step-${i}`,control:"button",label:String(i+1)},{variant:"rect"});n.addEventListener("multisynth-control-button-tap",()=>{const lanes=copy(state.lanes),v=state.selectedVoice;lanes[v].steps[i].on=!lanes[v].steps[i].on;send({lanes,selectedStep:i})});stepNodes.push(n)}
  const length=mount(laneControls,{id:"length",control:"knob",label:"LENGTH",value:{default:32,min:1,max:32,step:1}},{variant:"cap",valueReadout:true});bindKnob(length,()=>state.lanes[state.selectedVoice].length,v=>{const lanes=copy(state.lanes);lanes[state.selectedVoice].length=clamp(Math.round(v),1,32);send({lanes})},1,32,1);
  const mute=mount(laneControls,{id:"mute",control:"switch",label:"MUTE"},{variant:"rocker"}),solo=mount(laneControls,{id:"solo",control:"switch",label:"SOLO"},{variant:"rocker"});mute.addEventListener("multisynth-control-switch-change",e=>{const lanes=copy(state.lanes);lanes[state.selectedVoice].mute=!!e.detail?.on;send({lanes})});solo.addEventListener("multisynth-control-switch-change",e=>{const lanes=copy(state.lanes);lanes[state.selectedVoice].solo=!!e.detail?.on;send({lanes})});
  const lockMode=mount(laneControls,{id:"lockMode",control:"switch",label:"STEP LOCK"},{variant:"rocker"});lockMode.addEventListener("multisynth-control-switch-change",e=>send({lockMode:!!e.detail?.on}));
  function stepKnob(id,label,min,max,stepSize,key,unit=""){const n=mount(stepControls,{id,control:"knob",label,value:{default:min,min,max,step:stepSize},meta:{unit}},{variant:"cap",valueReadout:true});bindKnob(n,()=>state.lanes[state.selectedVoice].steps[state.selectedStep][key],v=>{const lanes=copy(state.lanes);lanes[state.selectedVoice].steps[state.selectedStep][key]=clamp(stepSize>=1?Math.round(v):v,min,max);send({lanes})},min,max,stepSize);nodes[id]=n}
  stepKnob("probability","PROBABILITY",0,100,1,"probability","%");stepKnob("velocity","VELOCITY",1,127,1,"velocity","");stepKnob("micro","MICRO",-50,50,1,"micro","%");stepKnob("ratchet","RATCHET",1,8,1,"ratchet","×");
  const fillOnly=mount(stepControls,{id:"fillOnly",control:"switch",label:"FILL ONLY"},{variant:"rocker"});fillOnly.addEventListener("multisynth-control-switch-change",e=>{const lanes=copy(state.lanes);lanes[state.selectedVoice].steps[state.selectedStep].fill=!!e.detail?.on;send({lanes})});
  const ranges={pitch:[20,3000,1],decay:[20,2500,1],bend:[-2500,2500,10],tone:[0,100,1],character:[0,100,1],level:[0,100,1]};
  for(const key of PARAMS){const [min,max,st]=ranges[key],n=mount(synthControls,{id:key,control:"knob",label:key.toUpperCase(),value:{default:BASE[0][key],min,max,step:st}},{variant:"cap",valueReadout:true});bindKnob(n,()=>{const lane=state.lanes[state.selectedVoice],s=lane.steps[state.selectedStep];return state.lockMode&&Number.isFinite(Number(s.locks[key]))?Number(s.locks[key]):lane.voice[key]},v=>{const lanes=copy(state.lanes),lane=lanes[state.selectedVoice],s=lane.steps[state.selectedStep],x=clamp(v,min,max);if(state.lockMode)s.locks[key]=x;else lane.voice[key]=x;send({lanes})},min,max,st);nodes[key]=n}
  const clearLocks=mount(synthControls,{id:"clearLocks",control:"button",label:"CLEAR STEP LOCKS"},{variant:"rect"});clearLocks.addEventListener("multisynth-control-button-tap",()=>{const lanes=copy(state.lanes);lanes[state.selectedVoice].steps[state.selectedStep].locks={};send({lanes})});
  function paint(){const v=state.selectedVoice,s=state.selectedStep,lane=state.lanes[v],st=lane.steps[s];run.commitSwitchState?.(state.running,{silent:true});fill.commitSwitchState?.(state.fill,{silent:true});mute.commitSwitchState?.(lane.mute,{silent:true});solo.commitSwitchState?.(lane.solo,{silent:true});lockMode.commitSwitchState?.(state.lockMode,{silent:true});fillOnly.commitSwitchState?.(st.fill,{silent:true});voiceNodes.forEach((n,i)=>n.dataset.selected=i===v?"1":"0");stepNodes.forEach((n,i)=>{n.dataset.selected=i===s?"1":"0";n.commitButtonState?.(!!lane.steps[i].on,{silent:true})});swing.setModuleValue?.(state.swing);length.setModuleValue?.(lane.length);nodes.probability?.setModuleValue?.(st.probability);nodes.velocity?.setModuleValue?.(st.velocity);nodes.micro?.setModuleValue?.(st.micro);nodes.ratchet?.setModuleValue?.(st.ratchet);for(const key of PARAMS){const x=state.lockMode&&Number.isFinite(Number(st.locks[key]))?Number(st.locks[key]):lane.voice[key];nodes[key]?.setModuleValue?.(x)}}
  paint();global.addEventListener("multisynth-state-sync",e=>{state=normalize({...model.defaults,...(e.detail||{})});paint()});
})(window);