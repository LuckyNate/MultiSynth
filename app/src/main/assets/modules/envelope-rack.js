"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function create(api){const c=api.context,input=c.createGain(),gate=c.createGain(),output=c.createGain();gate.gain.value=0;input.connect(gate).connect(output);api.setInput(input);api.setOutput(output);return{ctx:c,input,gate,output,state:api.state,held:new Set()};}
function attack(u,state,velocity){const now=u.ctx.currentTime,a=Math.max(.001,Number(state.attack)||.001),d=Math.max(.001,Number(state.decay)||.001),s=clamp(state.sustain??.75,0,1),peak=clamp(Number(velocity)/127,.001,1);const g=u.gate.gain;g.cancelScheduledValues(now);g.setValueAtTime(Math.max(.0001,g.value),now);g.linearRampToValueAtTime(peak,now+a);g.exponentialRampToValueAtTime(Math.max(.0001,peak*s),now+a+d);}
function release(u,state){const now=u.ctx.currentTime,r=Math.max(.001,Number(state.release)||.25),g=u.gate.gain;g.cancelScheduledValues(now);g.setValueAtTime(Math.max(.0001,g.value),now);g.exponentialRampToValueAtTime(.0001,now+r);g.setValueAtTime(0,now+r+.002);}
C.define({type:"envelope",displayName:"Been Served",category:"processor",version:"rack-envelope-2",editorUrl:"envelope.html",color:"#e4bd45",selectorClass:"envelope",description:"LEGAL-YELLOW ADSR · STAMPED ENVELOPE PROCESSOR",defaults:{attack:.001,decay:.1,sustain:.75,release:.25},create,
 setState({runtime,state}){runtime.user.state=state;},
 noteOn({runtime,state},note,velocity=127){const u=runtime.user;if(!u)return false;u.held.add(String(note));attack(u,state,velocity);return true;},
 noteOff({runtime,state},note){const u=runtime.user;if(!u)return false;u.held.delete(String(note));if(!u.held.size)release(u,state);return true;},
 panic({runtime,state}){const u=runtime.user;if(!u)return true;u.held.clear();release(u,{...state,release:.01});return true;},
 destroy({runtime}){try{runtime.user?.input?.disconnect();runtime.user?.gate?.disconnect();runtime.user?.output?.disconnect();}catch(_){}},
 serialize:({state})=>({...state}),restore:({saved})=>({attack:.001,decay:.1,sustain:.75,release:.25,...(saved||{})})});
})(window);
