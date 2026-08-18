"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const BANDS=[31,62,125,250,500,1000,2000,4000,8000,16000];
const defaults=()=>({b31:0,b62:0,b125:0,b250:0,b500:0,b1000:0,b2000:0,b4000:0,b8000:0,b16000:0,level:1,bypass:false});
function key(f){return "b"+f}
function create(api){const c=api.context,input=c.createGain(),dry=c.createGain(),wet=c.createGain(),level=c.createGain(),output=c.createGain(),filters=[];input.connect(dry).connect(output);let node=input;BANDS.forEach((f,i)=>{const q=c.createBiquadFilter();q.type=i===0?"lowshelf":i===BANDS.length-1?"highshelf":"peaking";q.frequency.value=f;if(q.type==="peaking")q.Q.value=1.4;node.connect(q);node=q;filters.push(q)});node.connect(wet).connect(level).connect(output);api.setInput(input);api.setOutput(output);const u={ctx:c,input,dry,wet,level,output,filters,state:api.state};apply(u,api.state);return u}
function apply(u,s){u.state=s;const now=u.ctx.currentTime,on=s.bypass!==true;u.dry.gain.setTargetAtTime(on?0:1,now,.01);u.wet.gain.setTargetAtTime(on?1:0,now,.01);u.level.gain.setTargetAtTime(clamp(s.level??1,0,2),now,.01);u.filters.forEach((f,i)=>f.gain.setTargetAtTime(clamp(s[key(BANDS[i])]??0,-12,12),now,.01))}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.dry,...u.filters,u.wet,u.level,u.output])try{n.disconnect()}catch(_){}}
C.define({type:"denzels-equalizer",displayName:"Denzel's Equalizer",category:"equalizer",version:"denzels-equalizer-1",editorUrl:"rack-module-editor.html",color:"#c7d0d8",selectorClass:"denzels-equalizer",description:"10-BAND GRAPHIC EQUALIZER · 31 HZ — 16 KHZ · ±12 DB",defaults:defaults(),create,setState({runtime,state}){if(runtime.user?.ctx)apply(runtime.user,state)},destroy,serialize:({state})=>({...state}),restore:({saved})=>({...defaults(),...(saved||{})})})
})(window);
