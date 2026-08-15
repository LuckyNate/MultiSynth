"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function driveCurve(amount){const n=2048,c=new Float32Array(n),a=clamp(amount,0,1);if(a<=.0001){for(let i=0;i<n;i++)c[i]=i/(n-1)*2-1;return c;}const k=1+a*24,norm=Math.tanh(k);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*k)/norm;}return c;}
function create(api){const c=api.context,input=c.createGain(),pre=c.createGain(),gain=c.createGain(),drive=c.createWaveShaper(),level=c.createGain(),output=c.createGain();drive.oversample="4x";input.connect(pre).connect(gain).connect(drive).connect(level).connect(output);api.setInput(input);api.setOutput(output);const u={ctx:c,input,pre,gain,drive,level,output,state:api.state};apply(u,api.state);return u;}
function apply(u,s){u.state=s;const now=u.ctx.currentTime;u.pre.gain.setTargetAtTime(clamp(s.pre??1,0,2),now,.01);u.gain.gain.setTargetAtTime(clamp(s.gain??1,0,4),now,.01);u.drive.curve=driveCurve(clamp(s.overdrive??0,0,1));u.level.gain.setTargetAtTime(clamp(s.level??1,0,2),now,.01);}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.pre,u.gain,u.drive,u.level,u.output])try{n.disconnect();}catch(_){}}
C.define({type:"master",displayName:"Master of Levels",category:"processor",version:"rack-master-3",editorUrl:"master.html",color:"#c61f2b",selectorClass:"master",description:"MASTER LEVEL STAGE · PRE · GAIN · OVERDRIVE · LEVEL",defaults:{pre:1,gain:1,overdrive:0,level:1},create,setState({runtime,state}){apply(runtime.user,state);},destroy,serialize:({state})=>({...state}),restore:({saved})=>({pre:1,gain:1,overdrive:0,level:1,...(saved||{})})});
})(window);
