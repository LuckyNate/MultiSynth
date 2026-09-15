"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,Events=MS.Events;if(!C||!I)return;
const eventName=(key,fallback)=>Events?.[key]||fallback;
const dispatch=(key,fallback,detail)=>Events?.dispatch?Events.dispatch(eventName(key,fallback),detail):global.dispatchEvent(new CustomEvent(eventName(key,fallback),{detail}));
const clampBpm=v=>Math.max(20,Math.min(300,Number(v)||120));
const midiBridgeInstances=new Set();
let unsubscribeMasterMidi=null;
function defaults(){return{bpm:120}}
function ensureMasterMidiBridge(){
  const T=MS.PatchTransport;
  if(unsubscribeMasterMidi||!T||midiBridgeInstances.size===0)return;
  unsubscribeMasterMidi=T.subscribeMidi?.(event=>{
    if(event?.external)return;
    const status=Number(event?.status)&255;
    if(status===0xf8)global.MultiSynthNativeMidi?.sendClockPulse?.();
    else if(status===0xfa)global.MultiSynthNativeMidi?.sendStart?.();
    else if(status===0xfb)global.MultiSynthNativeMidi?.sendContinue?.();
    else if(status===0xfc)global.MultiSynthNativeMidi?.sendStop?.();
  })||null;
}
function releaseMasterMidiBridge(){
  if(midiBridgeInstances.size!==0||!unsubscribeMasterMidi)return;
  try{unsubscribeMasterMidi()}catch(_){}
  unsubscribeMasterMidi=null;
}
function create(api){
  const u={ctx:api.context,unsubscribePulse:null,state:api.state};
  queueMicrotask(()=>{try{attach(C.getRuntime(api.instanceId))}catch(_){}});
  return u;
}
function detach(runtime){
  const u=runtime?.user;if(!u)return;
  if(u.unsubscribePulse){try{u.unsubscribePulse()}catch(_){}u.unsubscribePulse=null}
  midiBridgeInstances.delete(runtime.instanceId);
  releaseMasterMidiBridge();
}
function attach(runtime){
  const u=runtime?.user,T=MS.PatchTransport;if(!u||!T)return;
  midiBridgeInstances.add(runtime.instanceId);
  ensureMasterMidiBridge();
  if(u.unsubscribePulse)return;
  u.unsubscribePulse=T.subscribeScheduledPulse?.(pulse=>{
    let live=null;try{live=C.getRuntime(runtime.instanceId)}catch(_){}
    if(!live)return;
    const p=Number(pulse?.pulse)||0,bpm=Number(pulse?.bpm)||Number(T.bpm)||120,time=Number(pulse?.time)||live.user?.ctx?.currentTime||0;
    MS.NodeAudioGraph?.sendCV?.(runtime.instanceId,{kind:"trigger",clock:true,midiStatus:0xf8,origin:"patch-transport",value:1,gate:true,bpm,pulse:p,ppqn:24,time});
    if(p%24===0)dispatch("FATHER_TIME_CV_TRIGGER","multisynth-father-time-cv-trigger",{instanceId:runtime.instanceId,time,pulse:p,bpm});
  })||null;
}
function setState({runtime,state}){
  const u=runtime.user;if(u)u.state=state;
  attach(runtime);
}
function cv(_ctx,packet={}){return packet}
function destroy({runtime}){detach(runtime)}
C.define({type:I.FATHER_TIME,version:"midi-master-3",description:"ALWAYS-ON MIDI MASTER CLOCK · 24 PPQN · SINGLE MIDI OUT · CV CLOCK BRIDGE",defaults:defaults(),resources:["midi","storage"],dynamicPorts:{cvOut:"used-plus-one"},create,setState,cv,destroy,serialize:({state})=>({bpm:clampBpm(state?.bpm)}),restore:({saved})=>({bpm:clampBpm(saved?.bpm)})});
C.defineSurface(I.FATHER_TIME,{version:5,package:{id:I.FATHER_TIME,version:5,behavior:{role:"always-on-midi-master-clock",clock:"midi-24-ppqn",transport:"midi-realtime",midiOut:"single-shared-master-stream",cvClock:"derived-from-midi-clock",usbMidi:"real-midi-realtime",audioMode:"none",cvOutputs:"used-plus-one",stateOwnership:"module"}},faceplate:{livery:"antique-clock",primary:"#21170f",secondary:"#8d6b45",tertiary:"#e7d3ad"},defaults:defaults(),controls:[{id:"bpm",control:"encoder",state:"bpm",label:"BPM",value:{default:120,min:30,max:300,step:1},meta:{visual:"clock-dial",unit:" BPM"},node:"controller.bpm"},{id:"pulse",control:"led",label:"MIDI CLOCK",meta:{source:"cv"},node:"indicator.midiClock"}],sources:[{id:"source.patchMidi",type:"midiClock",mode:"24ppqn"}],actions:[{id:"action.midiOut",type:"midiRealtime"},{id:"action.cv",type:"cvClockBridge"}],nodes:{connections:[["source.patchMidi","action.midiOut"],["source.patchMidi","action.cv"],["action.cv","indicator.midiClock"]]}})
})(window);
