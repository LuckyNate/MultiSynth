"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;
if(!C||!I)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const defaults=()=>({channel:1,octave:0,velocity:127,pitch:0,mod:0,ribbon:0.5,xyX:0.5,xyY:0.5,knobs:Array(8).fill(0.5),faders:Array(8).fill(0.75),pads:Array(16).fill(0),mappings:{},padMappings:{},learn:false,learnTarget:null,keyboardLow:null,keyboardHigh:null,lastMessage:null});
function create(api){return{id:api.instanceId,state:api.state,emit:api.emit}}
function setState({runtime,state}){if(runtime.user)runtime.user.state=state}
function updateFromMidi(state,packet){const status=Number(packet.status)&255,cmd=status&0xf0,d1=Number(packet.data1??packet.data?.[1]??0)&127,d2=Number(packet.data2??packet.data?.[2]??0)&127;state.channel=(status&15)+1;state.lastMessage={status,data1:d1,data2:d2};if(cmd===0xe0){const raw=(d2<<7)|d1;state.pitch=clamp((raw-8192)/8192,-1,1)}else if(cmd===0xb0){if(d1===1)state.mod=d2/127;else if(d1>=16&&d1<=23){const a=state.knobs.slice();a[d1-16]=d2/127;state.knobs=a}else if(d1>=24&&d1<=31){const a=state.faders.slice();a[d1-24]=d2/127;state.faders=a}}else if(cmd===0x90||cmd===0x80){if(state.keyboardLow==null||d1<state.keyboardLow)state.keyboardLow=d1;if(state.keyboardHigh==null||d1>state.keyboardHigh)state.keyboardHigh=d1;const pad=state.padMappings?.[d1];if(Number.isInteger(pad)&&pad>=0&&pad<16){const a=state.pads.slice();a[pad]=cmd===0x90&&d2>0?d2/127:0;state.pads=a}}return state}
function midiMessage({runtime,state},packet){updateFromMidi(state,packet);if(runtime.user)runtime.user.state=state;return true}
function panic({runtime}){runtime.user?.emit?.("midi",{status:0xb0,data1:123,data2:0,data:[0xb0,123,0]});return true}
function destroy(){}
const controls=[
{id:"channel",control:"encoder",state:"channel",label:"CHANNEL",value:{default:1,min:1,max:16,step:1}},
{id:"octave",control:"encoder",state:"octave",label:"OCTAVE",value:{default:0,min:-4,max:4,step:1}},
{id:"velocity",control:"knob",state:"velocity",label:"VELOCITY",value:{default:127,min:1,max:127,step:1}},
{id:"pitch",control:"ribbon",state:"pitch",label:"PITCH",value:{default:0,min:-1,max:1,step:.001}},
{id:"mod",control:"fader",state:"mod",label:"MOD",value:{default:0,min:0,max:1,step:.001}},
{id:"ribbon",control:"ribbon",state:"ribbon",label:"RIBBON",value:{default:.5,min:0,max:1,step:.001}},
{id:"xy",control:"xy",label:"XY",meta:{xState:"xyX",yState:"xyY"}},
...Array.from({length:8},(_,i)=>({id:`knob-${i+1}`,control:"knob",label:`KNOB ${i+1}`,value:{default:.5,min:0,max:1,step:.001},meta:{arrayState:"knobs",index:i,midiCC:16+i}})),
...Array.from({length:8},(_,i)=>({id:`fader-${i+1}`,control:"fader",label:`FADER ${i+1}`,value:{default:.75,min:0,max:1,step:.001},meta:{arrayState:"faders",index:i,midiCC:24+i}})),
...Array.from({length:16},(_,i)=>({id:`pad-${i+1}`,control:"pad",label:String(i+1),meta:{padIndex:i,midiNote:36+i}})),
{id:"learn",control:"switch",state:"learn",label:"MIDI LEARN"},
{id:"scope",control:"oscilloscope",label:"",node:"monitor.scope"}
];
C.define({type:I.CONTROL_FREAK,version:"control-freak-1",description:"FULL PERFORMANCE CONTROLLER · REAL MIDI HARDWARE LIAISON · LEARNABLE MAPPING SURFACE",defaults:defaults(),resources:["midi"],create,setState,destroy,midiMessage,panic,serialize:({state})=>({...state,pitch:0,pads:Array(16).fill(0)}),restore:({saved})=>Object.assign(defaults(),saved||{},{pitch:0,pads:Array(16).fill(0)})});
C.defineSurface(I.CONTROL_FREAK,{version:6,package:{id:I.CONTROL_FREAK,version:6,behavior:{role:"performance-controller-liaison",inputs:["hardware-midi","midi"],outputs:["midi"],performanceSurface:"control-keyboard.js",midiLearn:true,hardwareDiscovery:true,stateOwnership:"module"}},faceplate:{livery:"controller-blue",primary:"#071527",secondary:"#75b7ff",tertiary:"#e1f1ff"},defaults:defaults(),controls,sources:[{id:"source.touch",type:"performanceInput"},{id:"source.midi",type:"midiInput"}],actions:[{id:"action.midi",type:"midiOutput"}],nodes:{connections:[["source.touch","action.midi"],["source.midi","action.midi"]]}});
})(window);

(function(global){
if(global.parent===global)return;
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,C=P.ModuleContract,R=global.MultiSynth?.ControlSurfaceRenderer,PK=global.MultiSynth?.PerformanceKeyboard,root=document.getElementById("controls"),keyboardHost=document.getElementById("performanceKeyboard"),screen=document.getElementById("screen");
if(!instance||!E||!A||!R||!root)return;
const module=E.getModule(instance);if(!module)return;
const getState=()=>E.getModule(instance)?.state||module.state||{};
const setState=patch=>E.setModuleState?.(instance,patch);
const channelStatus=cmd=>cmd|((clamp((getState().channel||1),1,16)-1)&15);
const send=(status,data1=0,data2=0)=>A.midiFrom?.(instance,{status,data1:data2===undefined?data1:data1,data2:data2,data:[status,data1,data2]});
const sendCC=(cc,value)=>send(channelStatus(0xb0),cc,Math.round(clamp(value,0,1)*127));
const sendPitch=value=>{const n=Math.round((clamp(value,-1,1)+1)*8191.5),lsb=n&127,msb=(n>>7)&127;send(channelStatus(0xe0),lsb,msb)};
const bank=(title)=>{const el=document.createElement("section");el.className="ms-module-bank";const h=document.createElement("div");h.className="cfMapModule";h.textContent=title;el.appendChild(h);root.appendChild(el);return el};
const mount=(host,spec,value)=>R.mount(host,{...spec,...(spec.value?{value:{...spec.value,value:value??spec.value.default}}:{})});
root.innerHTML="";root.classList.add("ms-module-surface");
const state=getState(),performance=bank("PERFORMANCE"),knobs=bank("KNOBS 1–8 · CC16–23"),faders=bank("FADERS 1–8 · CC24–31"),pads=bank("PADS 1–16 · NOTES 36–51"),setup=bank("SETUP / MIDI LEARN");
const specs=[
[performance,{id:"channel",control:"encoder",state:"channel",label:"CHANNEL",value:{default:1,min:1,max:16,step:1}},state.channel],
[performance,{id:"octave",control:"encoder",state:"octave",label:"OCTAVE",value:{default:0,min:-4,max:4,step:1}},state.octave],
[performance,{id:"velocity",control:"knob",state:"velocity",label:"VELOCITY",value:{default:127,min:1,max:127,step:1}},state.velocity],
[performance,{id:"pitch",control:"ribbon",state:"pitch",label:"PITCH",value:{default:0,min:-1,max:1,step:.001}},state.pitch],
[performance,{id:"mod",control:"fader",state:"mod",label:"MOD",value:{default:0,min:0,max:1,step:.001}},state.mod],
[performance,{id:"ribbon",control:"ribbon",state:"ribbon",label:"RIBBON",value:{default:.5,min:0,max:1,step:.001}},state.ribbon],
[performance,{id:"xy",control:"xy",label:"XY"},null],
...Array.from({length:8},(_,i)=>[knobs,{id:`knob-${i+1}`,control:"knob",label:`KNOB ${i+1}`,value:{default:.5,min:0,max:1,step:.001}},state.knobs?.[i]??.5]),
...Array.from({length:8},(_,i)=>[faders,{id:`fader-${i+1}`,control:"fader",label:`FADER ${i+1}`,value:{default:.75,min:0,max:1,step:.001}},state.faders?.[i]??.75]),
...Array.from({length:16},(_,i)=>[pads,{id:`pad-${i+1}`,control:"pad",label:String(i+1),meta:{padIndex:i}},null]),
[setup,{id:"learn",control:"switch",state:"learn",label:"MIDI LEARN"},state.learn],
[setup,{id:"scope",control:"oscilloscope",label:"",meta:{visual:{width:320,height:140}}},null]
];
for(const [host,spec,value] of specs)mount(host,spec,value);
root.addEventListener("multisynth-control-value-change",e=>{const id=e.detail?.controlId,v=Number(e.detail?.value);if(!id||!Number.isFinite(v))return;if(["channel","octave","velocity","pitch","mod","ribbon"].includes(id)){setState({[id]:v});if(id==="pitch")sendPitch(v);else if(id==="mod")sendCC(1,v);else if(id==="ribbon")sendCC(74,v);screen&&(screen.textContent=`${id.toUpperCase()} ${v.toFixed(3)}`);return}let m=id.match(/^knob-(\d+)$/);if(m){const i=Number(m[1])-1,a=(getState().knobs||Array(8).fill(.5)).slice();a[i]=v;setState({knobs:a});sendCC(16+i,v);return}m=id.match(/^fader-(\d+)$/);if(m){const i=Number(m[1])-1,a=(getState().faders||Array(8).fill(.75)).slice();a[i]=v;setState({faders:a});sendCC(24+i,v)}});
root.addEventListener("multisynth-control-tap",e=>{if(e.detail?.controlId==="learn"){const next=!getState().learn;setState({learn:next});screen&&(screen.textContent=next?"MIDI LEARN · MOVE A HARDWARE CONTROL":"READY")}});
for(let i=0;i<16;i++){const el=root.querySelector?.(`[data-control-id="pad-${i+1}"]`);if(!el)continue;const note=36+i;el.addEventListener("pointerdown",()=>{const v=clamp(getState().velocity||127,1,127);A.noteOnFrom?.(instance,note,v);screen&&(screen.textContent=`PAD ${i+1} · NOTE ${note}`)});const off=()=>A.noteOffFrom?.(instance,note);el.addEventListener("pointerup",off);el.addEventListener("pointercancel",off);el.addEventListener("pointerleave",off)}
if(keyboardHost){const audio={resume:()=>A.resume?.(),noteOn:(n,v)=>A.noteOnFrom?.(instance,n+12*(getState().octave||0),v??getState().velocity??127),noteOff:n=>A.noteOffFrom?.(instance,n+12*(getState().octave||0)),retuneNote:()=>0,panic:()=>C?.panic?.(instance)};PK?.mount?.(keyboardHost,{audio})}
})(window);
