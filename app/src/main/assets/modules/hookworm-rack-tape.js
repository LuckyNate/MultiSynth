"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function create(api){
 const c=api.context,input=c.createGain(),output=c.createGain();
 const proc=c.createScriptProcessor(1024,1,1);input.connect(proc);proc.connect(output);api.setInput(input);api.setOutput(output);
 const maxFrames=Math.ceil(c.sampleRate*20),tape=new Float32Array(maxFrames);
 const u={ctx:c,input,output,proc,tape,pos:0,state:api.state};
 proc.onaudioprocess=e=>{
   const x=e.inputBuffer.getChannelData(0),y=e.outputBuffer.getChannelData(0),s=u.state||{};
   const running=!!s.running,lenSec=clamp(s.length??4,.5,20),speed=clamp(s.speed??1,.25,4),erase=clamp(s.erase??1,0,1);
   const loopFrames=Math.max(1,Math.min(maxFrames,Math.floor(lenSec*c.sampleRate)));
   if(!running){for(let i=0;i<y.length;i++)y[i]=x[i];return;}
   let p=u.pos;
   for(let i=0;i<y.length;i++){
     const i0=Math.floor(p)%loopFrames,i1=(i0+1)%loopFrames,frac=p-Math.floor(p);
     const old=u.tape[i0]*(1-frac)+u.tape[i1]*frac;
     y[i]=old;
     const keep=1-erase;
     u.tape[i0]=u.tape[i0]*keep+x[i];
     p+=speed;
     while(p>=loopFrames)p-=loopFrames;
   }
   u.pos=p;
 };
 return u;
}
function setState({runtime,state}){runtime.user.state=state;}
function destroy({runtime}){const u=runtime.user;if(!u)return;u.proc.onaudioprocess=null;try{u.input.disconnect();u.proc.disconnect();u.output.disconnect();}catch(_){}}
C.define({type:"hookworm",displayName:"Hookworm",category:"looper",version:"rack-tape-2",editorUrl:"hookworm.html",color:"#e98232",selectorClass:"hookworm",description:"VARIABLE-SPEED CONTINUOUS TAPE LOOP",defaults:{length:4,speed:1,erase:1,threshold:.14,running:false},resources:["mic","storage"],create,setState,destroy,serialize:({state})=>({...state}),restore:({saved})=>({...saved})});
})(window);
