"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function create(api){
  const c=api.context;if(!c)return{};
  const input=c.createGain(),low=c.createBiquadFilter(),mid=c.createBiquadFilter(),high=c.createBiquadFilter(),output=c.createGain();
  low.type="lowshelf";low.frequency.value=250;
  mid.type="peaking";mid.frequency.value=1200;mid.Q.value=.8;
  high.type="highshelf";high.frequency.value=4000;
  input.connect(low).connect(mid).connect(high).connect(output);
  api.setInput(input);api.setOutput(output);
  const u={ctx:c,input,low,mid,high,output};apply(u,api.state);return u;
}
function apply(u,s){
  const now=u.ctx.currentTime;
  u.low.gain.setTargetAtTime(clamp(s.low??0,-18,18),now,.015);
  u.mid.gain.setTargetAtTime(clamp(s.mid??0,-18,18),now,.015);
  u.high.gain.setTargetAtTime(clamp(s.high??0,-18,18),now,.015);
}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.low,u.mid,u.high,u.output])try{n.disconnect();}catch(_){}}
C.define({
  type:"garageband",displayName:"Garage Band",category:"filter",version:"rack-2-avocado",
  editorUrl:"garage-band.html",color:"#7f9334",selectorClass:"garageband",
  description:"70S AVOCADO THREE-BAND FILTER · LOW / MID / HIGH",
  defaults:{low:0,mid:0,high:0},create,
  setState({runtime,state}){if(runtime.user?.ctx)apply(runtime.user,state);},
  destroy,serialize:({state})=>({...state}),restore:({saved})=>({low:0,mid:0,high:0,...(saved||{})})
});
})(window);
