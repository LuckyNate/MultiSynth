"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
function defaults(){return{bpm:120,swing:0,running:false,division:4,accent:true};}
function create(api){const c=api.context,input=c.createGain(),output=c.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{ctx:c,input,output,state:api.state};}
function clockTick({runtime,state},tick){const u=runtime.user;if(!u||state.running===false)return false;const div=Math.max(1,Math.round(Number(state.division)||4)),stride=Math.max(1,16/div);if((tick.substep||0)%stride!==0)return true;const accent=!!state.accent&&((tick.beat||0)%4===0);global.dispatchEvent(new CustomEvent("multisynth-temporal-gnome-tick",{detail:{instanceId:runtime.instanceId,time:tick.time,accent,substep:tick.substep,beat:tick.beat,bpm:tick.bpm}}));return true;}
function setState({runtime,state}){if(runtime.user)runtime.user.state=state;}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.output])try{n.disconnect();}catch(_){}}
C.define({type:"metronome",displayName:"Temporal Gnome",category:"clock",version:"rack-clock-3",editorUrl:"metronome.html",color:"#55aaff",selectorClass:"metronome",description:"SILENT MASTER CLOCK · BPM · SWING · DIVISION",defaults:defaults(),resources:["storage"],create,setState,clockTick,destroy,serialize:({state})=>({...state}),restore:({saved})=>Object.assign(defaults(),saved||{})});
})(window);
