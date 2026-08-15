"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
function defaults(){return{bpm:120,swing:0,running:false,division:4,accent:true,level:.22};}
function create(api){const c=api.context,input=c.createGain(),clicks=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);clicks.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);return{ctx:c,input,clicks,mix,output,state:api.state};}
function click(u,t,accent){const c=u.ctx,n=Math.max(32,Math.floor(c.sampleRate*.012)),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++){const x=1-i/n;d[i]=(Math.random()*2-1)*x*x;}const src=c.createBufferSource(),hp=c.createBiquadFilter(),g=c.createGain();src.buffer=b;hp.type="highpass";hp.frequency.value=accent?2600:3400;hp.Q.value=.7;const level=Math.max(0,Math.min(.6,Number(u.state.level)||0));g.gain.setValueAtTime(Math.max(.0001,level*(accent?1:.72)),t);g.gain.exponentialRampToValueAtTime(.0001,t+.018);src.connect(hp).connect(g).connect(u.clicks);src.start(t);}
function clockTick({runtime,state},tick){const u=runtime.user;if(!u||state.running===false)return false;const div=Math.max(1,Math.round(Number(state.division)||4)),stride=Math.max(1,16/div);if((tick.substep||0)%stride!==0)return true;const accent=!!state.accent&&((tick.beat||0)%4===0);click(u,tick.time,accent);global.dispatchEvent(new CustomEvent("multisynth-temporal-gnome-tick",{detail:{instanceId:runtime.instanceId,time:tick.time,accent,substep:tick.substep,beat:tick.beat,bpm:tick.bpm}}));return true;}
function setState({runtime,state}){if(runtime.user)runtime.user.state=state;}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.clicks,u.mix,u.output])try{n.disconnect();}catch(_){}}
C.define({type:"metronome",displayName:"Temporal Gnome",category:"clock",version:"rack-clock-2",editorUrl:"metronome.html",color:"#55aaff",selectorClass:"metronome",description:"MASTER CLOCK · BPM · SWING · DIVISION",defaults:defaults(),resources:["storage"],create,setState,clockTick,destroy,serialize:({state})=>({...state}),restore:({saved})=>Object.assign(defaults(),saved||{})});
})(window);
