"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
function defaults(){return{bpm:120,swing:0,running:false,division:4,accent:true,level:.22};}
function create(api){const c=api.context,input=c.createGain(),clicks=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);clicks.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);return{ctx:c,input,clicks,mix,output,state:api.state};}
function click(u,t,accent){const o=u.ctx.createOscillator(),g=u.ctx.createGain();o.type="square";o.frequency.value=accent?1320:880;const level=Math.max(0,Math.min(.6,Number(u.state.level)||0));g.gain.setValueAtTime(Math.max(.0001,level*(accent?1:.65)),t);g.gain.exponentialRampToValueAtTime(.0001,t+.025);o.connect(g).connect(u.clicks);o.start(t);o.stop(t+.03);}
function clockTick({runtime,state},tick){const u=runtime.user;if(!u||state.running===false)return false;const div=Math.max(1,Math.round(Number(state.division)||4));if((tick.substep||0)%Math.max(1,16/div)!==0)return true;click(u,tick.time,!!state.accent&&((tick.beat||0)%4===0));return true;}
function setState({runtime,state}){if(runtime.user)runtime.user.state=state;}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.clicks,u.mix,u.output])try{n.disconnect();}catch(_){}}
C.define({type:"metronome",displayName:"Metronome",category:"clock",version:"rack-clock-1",editorUrl:"metronome.html",color:"#d8d8d8",selectorClass:"metronome",description:"MASTER CLOCK · BPM · SWING · DIVISION",defaults:defaults(),resources:["storage"],create,setState,clockTick,destroy,serialize:({state})=>({...state}),restore:({saved})=>Object.assign(defaults(),saved||{})});
})(window);
