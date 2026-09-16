"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,Events=MS.Events,T=MS.PatchTransport;
if(!C||!I||!T)return;

const MIDI=Object.freeze({CLOCK:0xf8,START:0xfa,CONTINUE:0xfb,STOP:0xfc});
const clampBpm=v=>Math.max(20,Math.min(300,Number(v)||120));
const instances=new Set();
let unsubscribeMidi=null;

const eventName=(key,fallback)=>Events?.[key]||fallback;
const dispatch=(key,fallback,detail)=>Events?.dispatch
  ?Events.dispatch(eventName(key,fallback),detail)
  :global.dispatchEvent(new CustomEvent(eventName(key,fallback),{detail}));

function defaults(){return{bpm:120}}

function driveMaster(state){
  T.setBpm(clampBpm(state?.bpm));
  if(!T.external&&!T.running)T.start();
}

function sendPhysicalRealtime(event){
  if(event?.external)return;
  const status=Number(event?.status)&255;
  if(status===MIDI.CLOCK)global.MultiSynthNativeMidi?.sendClockPulse?.();
  else if(status===MIDI.START)global.MultiSynthNativeMidi?.sendStart?.();
  else if(status===MIDI.CONTINUE)global.MultiSynthNativeMidi?.sendContinue?.();
  else if(status===MIDI.STOP)global.MultiSynthNativeMidi?.sendStop?.();
}

function ensurePhysicalMidiBridge(){
  if(unsubscribeMidi||instances.size===0)return;
  unsubscribeMidi=T.subscribeMidi(sendPhysicalRealtime)||null;
}

function releasePhysicalMidiBridge(){
  if(instances.size!==0||!unsubscribeMidi)return;
  try{unsubscribeMidi()}catch(_){}
  unsubscribeMidi=null;
}

function create(api){
  const id=api.instanceId;
  const user={state:api.state,unsubscribePulse:null};
  instances.add(id);
  ensurePhysicalMidiBridge();
  driveMaster(api.state);

  user.unsubscribePulse=T.subscribePulse?.(pulse=>{
    const p=Number(pulse?.pulse)||0;
    if(!p||p%24!==0)return;
    const bpm=Number(pulse?.bpm)||Number(T.bpm)||120;
    const time=Number.isFinite(Number(pulse?.time))?Number(pulse.time):(api.context?.currentTime||0);
    MS.NodeAudioGraph?.sendClock?.(id,{kind:"clock",status:MIDI.CLOCK,origin:"patch-transport",bpm,pulse:p,ppqn:24,time});
    dispatch("FATHER_TIME_CLOCK_TICK","multisynth-father-time-clock-tick",{instanceId:id,time,pulse:p,bpm});
  })||null;

  return user;
}

function setState({runtime,state}){
  if(runtime.user)runtime.user.state=state;
  driveMaster(state);
}

function clock(_ctx,packet={}){return packet}

function destroy({runtime}){
  const user=runtime.user;
  if(user?.unsubscribePulse)try{user.unsubscribePulse()}catch(_){}
  instances.delete(runtime.instanceId);
  releasePhysicalMidiBridge();
}

C.define({
  type:I.FATHER_TIME,
  version:"midi-master-6",
  description:"ALWAYS-ON SHARED MIDI MASTER · AUDIOWORKLET TIMEBASE · 24 PPQN · EXTERNAL MIDI CLOCK OVERRIDE · QUARTER-NOTE CLOCK JACK",
  defaults:defaults(),
  resources:["midi","storage"],
  dynamicPorts:{clockOut:"used-plus-one"},
  create,setState,clock,destroy,
  serialize:({state})=>({bpm:clampBpm(state?.bpm)}),
  restore:({saved})=>({bpm:clampBpm(saved?.bpm)})
});

C.defineSurface(I.FATHER_TIME,{
  version:8,
  package:{id:I.FATHER_TIME,version:8,behavior:{
    role:"always-on-midi-master-clock",
    clock:"midi-24-ppqn",
    transport:"patch-transport-audioworklet-master",
    midiOut:"single-shared-master-stream",
    clockJack:"quarter-note-from-live-midi-clock",
    usbMidi:"real-midi-realtime",
    audioMode:"none",
    clockOutputs:"used-plus-one",
    stateOwnership:"module"
  }},
  faceplate:{livery:"antique-clock",primary:"#21170f",secondary:"#8d6b45",tertiary:"#e7d3ad"},
  defaults:defaults(),
  controls:[
    {id:"bpm",control:"encoder",state:"bpm",label:"BPM",value:{default:120,min:30,max:300,step:.05},meta:{visual:"clock-dial",unit:" BPM"},node:"controller.bpm"},
    {id:"pulse",control:"led",label:"MIDI CLOCK",meta:{source:"clock"},node:"indicator.midiClock"}
  ],
  sources:[{id:"source.patchMidi",type:"midiClock",mode:"24ppqn"}],
  actions:[{id:"action.midiOut",type:"midiRealtime"},{id:"action.clock",type:"clockJack"}],
  nodes:{connections:[["source.patchMidi","action.midiOut"],["source.patchMidi","action.clock"],["action.clock","indicator.midiClock"]]}
});
})(window);
