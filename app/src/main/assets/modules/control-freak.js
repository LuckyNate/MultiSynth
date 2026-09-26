"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;
if(!C||!I)return;
const defaults=()=>({channel:1,octave:0,velocity:127,pitch:0,mod:0,ribbon:0.5,xyX:0.5,xyY:0.5,knobs:Array(8).fill(0.5),faders:Array(8).fill(0.75),pads:Array(16).fill(0)});
function create(api){return{id:api.instanceId,state:api.state,emit:api.emit}}
function setState({runtime,state}){if(runtime.user)runtime.user.state=state}
function panic({runtime,state}){const ch=Math.max(0,Math.min(15,(Number(state.channel)||1)-1));runtime.user?.emit?.("midi",{status:0xb0|ch,data1:123,data2:0,data:[0xb0|ch,123,0]});return true}
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
{id:"panic",control:"button",label:"PANIC"}
];
C.define({type:I.CONTROL_FREAK,version:"control-freak-software-1",description:"FULL SOFTWARE MIDI PERFORMANCE CONTROLLER",defaults:defaults(),create,setState,destroy,panic,serialize:({state})=>({...state,pitch:0,pads:Array(16).fill(0)}),restore:({saved})=>Object.assign(defaults(),saved||{},{pitch:0,pads:Array(16).fill(0)})});
C.defineSurface(I.CONTROL_FREAK,{version:7,package:{id:I.CONTROL_FREAK,version:7,behavior:{role:"software-midi-controller",inputs:[],outputs:["midi"],performanceSurface:"control-keyboard.js",stateOwnership:"module"}},faceplate:{livery:"controller-blue",primary:"#071527",secondary:"#75b7ff",tertiary:"#e1f1ff"},defaults:defaults(),controls,sources:[{id:"source.touch",type:"performanceInput"}],actions:[{id:"action.midi",type:"midiOutput"}],nodes:{connections:[["source.touch","action.midi"]]}});
})(window);

(function(global){
if(global.parent===global)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph,C=P.ModuleContract,R=global.MultiSynth?.ControlSurfaceRenderer,PK=global.MultiSynth?.PerformanceKeyboard,root=document.getElementById("controls"),keyboardHost=document.getElementById("performanceKeyboard"),screen=document.getElementById("screen");
if(!instance||!E||!A||!R||!root)return;
const module=E.getModule(instance);if(!module)return;
const getState=()=>E.getModule(instance)?.state||module.state||{};
const setState=patch=>E.setModuleState?.(instance,patch);
const channelStatus=cmd=>cmd|((clamp(getState().channel||1,1,16)-1)&15);
const send=(status,data1=0,data2=0)=>A.midiFrom?.(instance,{status,data1,data2,data:[status,data1,data2]});
const sendCC=(cc,value)=>send(channelStatus(0xb0),cc,Math.round(clamp(value,0,1)*127));
const sendPitch=value=>{const n=Math.round((clamp(value,-1,1)+1)*8191.5),lsb=n&127,msb=(n>>7)&127;send(channelStatus(0xe0),lsb,msb)};
const show=text=>{if(screen)screen.textContent=text};
const bank=title=>{const el=document.createElement("section");el.className="ms-module-bank";const h=document.createElement("div");h.className="cfMapModule";h.textContent=title;el.appendChild(h);root.appendChild(el);return el};
const mount=(host,spec,value)=>R.mount(host,{...spec,...(spec.value?{value:{...spec.value,value:value??spec.value.default}}:{})});
root.innerHTML="";root.classList.add("ms-module-surface");
const state=getState(),performance=bank("PERFORMANCE"),knobs=bank("KNOBS 1–8 · CC16–23"),faders=bank("FADERS 1–8 · CC24–31"),pads=bank("PADS 1–16 · NOTES 36–51"),utility=bank("UTILITY");
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
[utility,{id:"panic",control:"button",label:"PANIC"},null]
];
for(const [host,spec,value] of specs)mount(host,spec,value);
root.addEventListener("multisynth-control-value-change",e=>{const id=e.detail?.controlId,v=Number(e.detail?.value);if(!id||!Number.isFinite(v))return;if(id==="channel"){setState({channel:Math.round(clamp(v,1,16))});show(`CHANNEL ${Math.round(clamp(v,1,16))}`);return}if(id==="octave"){setState({octave:Math.round(clamp(v,-4,4))});show(`OCTAVE ${Math.round(clamp(v,-4,4))}`);return}if(id==="velocity"){setState({velocity:Math.round(clamp(v,1,127))});show(`VELOCITY ${Math.round(clamp(v,1,127))}`);return}if(id==="pitch"){setState({pitch:v});sendPitch(v);show(`PITCH ${v.toFixed(3)}`);return}if(id==="mod"){setState({mod:v});sendCC(1,v);show(`MOD ${Math.round(v*127)}`);return}if(id==="ribbon"){setState({ribbon:v});sendCC(74,v);show(`RIBBON ${Math.round(v*127)}`);return}let m=id.match(/^knob-(\d+)$/);if(m){const i=Number(m[1])-1,a=(getState().knobs||Array(8).fill(.5)).slice();a[i]=v;setState({knobs:a});sendCC(16+i,v);show(`KNOB ${i+1} · CC${16+i} · ${Math.round(v*127)}`);return}m=id.match(/^fader-(\d+)$/);if(m){const i=Number(m[1])-1,a=(getState().faders||Array(8).fill(.75)).slice();a[i]=v;setState({faders:a});sendCC(24+i,v);show(`FADER ${i+1} · CC${24+i} · ${Math.round(v*127)}`)}});
const pitch=root.querySelector?.('[data-control-id="pitch"]');
if(pitch){const center=()=>{setState({pitch:0});pitch.commitControlValue?.(0,{silent:true});sendPitch(0);show("PITCH 0")};pitch.addEventListener("pointerup",center);pitch.addEventListener("pointercancel",center);pitch.addEventListener("pointerleave",e=>{if(e.buttons)center()})}
const xy=root.querySelector?.('[data-control-id="xy"]');
if(xy){let active=false;const update=e=>{if(!active)return;const r=xy.getBoundingClientRect(),x=clamp((e.clientX-r.left)/(r.width||1),0,1),y=clamp(1-(e.clientY-r.top)/(r.height||1),0,1);setState({xyX:x,xyY:y});sendCC(12,x);sendCC(13,y);show(`XY ${Math.round(x*127)} · ${Math.round(y*127)}`)};xy.addEventListener("pointerdown",e=>{active=true;xy.setPointerCapture?.(e.pointerId);update(e)});xy.addEventListener("pointermove",update);const end=e=>{active=false;try{xy.releasePointerCapture?.(e.pointerId)}catch(_){}};xy.addEventListener("pointerup",end);xy.addEventListener("pointercancel",end)}
for(let i=0;i<16;i++){const el=root.querySelector?.(`[data-control-id="pad-${i+1}"]`);if(!el)continue;const note=36+i;let down=false;el.addEventListener("pointerdown",()=>{if(down)return;down=true;const v=Math.round(clamp(getState().velocity||127,1,127));const a=(getState().pads||Array(16).fill(0)).slice();a[i]=v/127;setState({pads:a});A.noteOnFrom?.(instance,note,v);show(`PAD ${i+1} · NOTE ${note} · VEL ${v}`)});const off=()=>{if(!down)return;down=false;const a=(getState().pads||Array(16).fill(0)).slice();a[i]=0;setState({pads:a});A.noteOffFrom?.(instance,note)};el.addEventListener("pointerup",off);el.addEventListener("pointercancel",off);el.addEventListener("pointerleave",e=>{if(e.buttons)off()})}
const panic=root.querySelector?.('[data-control-id="panic"]');if(panic)panic.addEventListener("click",()=>{C?.panic?.(instance);show("PANIC · ALL NOTES OFF")});
if(keyboardHost){const held=new Map(),audio={resume:()=>A.resume?.(),noteOn:(n,v)=>{const out=n+12*(getState().octave||0),vel=Math.round(clamp(v??getState().velocity??127,1,127));held.set(n,out);A.noteOnFrom?.(instance,out,vel);show(`KEY ${out} · VEL ${vel}`)},noteOff:n=>{const out=held.get(n)??n+12*(getState().octave||0);held.delete(n);A.noteOffFrom?.(instance,out)},retuneNote:()=>0,panic:()=>C?.panic?.(instance)};PK?.mount?.(keyboardHost,{audio})}
show("READY · SOFTWARE MIDI OUT");
})(window);
