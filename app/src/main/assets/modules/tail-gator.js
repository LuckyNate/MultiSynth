"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;if(!C||!I)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function create(api){const c=api.context,input=c.createGain(),normalizer=c.createDynamicsCompressor(),lift=c.createGain(),output=c.createGain();normalizer.threshold.value=-20;normalizer.knee.value=12;normalizer.ratio.value=3;normalizer.attack.value=.004;normalizer.release.value=.2;input.connect(normalizer).connect(lift).connect(output);api.setInput(input);api.setOutput(output);const u={ctx:c,input,normalizer,lift,output};apply(u,api.state);return u;}
function apply(u,s){const on=s.normalize!==false,now=u.ctx.currentTime;u.normalizer.threshold.setTargetAtTime(on?-20:0,now,.01);u.normalizer.knee.setTargetAtTime(on?12:0,now,.01);u.normalizer.ratio.setTargetAtTime(on?3:1,now,.01);const pct=clamp(s.tailLift??160,100,250);u.lift.gain.setTargetAtTime(pct/100,now,.015);}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.normalizer,u.lift,u.output])try{n.disconnect();}catch(_){}}
C.define({type:I.TAIL_GATOR,version:"tail-gator-2",description:"TERMINAL CAR / EXTERNAL OUTPUT · NORMALIZED PARTY LEVEL",defaults:{armed:false,sinkId:"",normalize:true,tailLift:160},create,setState({runtime,state}){apply(runtime.user,state);const ev=new CustomEvent("multisynth-tail-gator",{detail:{instanceId:runtime.instanceId,armed:!!state.armed,sinkId:String(state.sinkId||"")}});global.dispatchEvent(ev);},destroy,serialize:({state})=>({...state}),restore:({saved})=>({armed:false,sinkId:"",normalize:true,tailLift:160,...(saved||{})})});
})(window);
