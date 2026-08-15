"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const TAU=Math.PI*2,types=["puresynth","quadsynth","pulsynth","sinladder","razorback","stinger","noquarter"];
const meta={
 puresynth:["PureSynth","puresynth.html","#f4f4f0","pure","MATHEMATICALLY PURE WAVEFORM ENGINE"],
 quadsynth:["QuadSynth","quadsynth.html","#ffb000","quad","CLICK · SINE · SAW · SQUARE"],
 pulsynth:["Pulsynth","pulsynth.html","#58ff78","pulse","THREE-STAGE PWM LADDER"],
 sinladder:["SinLadder","sinladder.html","#36eaff","sine","THREE-STAGE SINE HARMONIC LADDER"],
 razorback:["Razorback","razorback.html","#ff3d42","saw","TRIANGLE / MOVABLE-PEAK LADDER"],
 stinger:["Stinger","stinger.html","#ffe64a","stinger","POINTED SPINE CLICK LADDER"],
 noquarter:["No Quarter","noquarter.html","#77a4ff","noquarter","HAUNTED VELOCITY ELECTRIC PIANO"]
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),freq=n=>440*Math.pow(2,(Number(n)-69)/12);
function defaults(type){return{master:.35,level:.8,carrier:1,waveform:type==="puresynth"?"sine":null,pwm:50,peak:50,attack:.001,decay:.1,sustain:.75,release:.25,amount1:.35,amount2:.25,amount3:.20,phase1:0,phase2:120,phase3:240,octave1:0,octave2:0,octave3:0,detune1:0,detune2:0,detune3:0};}
function tri(p,peak=.5){p=((p%1)+1)%1;peak=clamp(peak,.02,.98);return p<peak?-1+2*p/peak:1-2*(p-peak)/(1-peak);}
function pulse(p,duty=.5){p=((p%1)+1)%1;return p<duty?1:-1;}
function saw(p){p=((p%1)+1)%1;return p*2-1;}
function click(p){p=((p%1)+1)%1;const w=.08;if(p>=w)return 0;const q=p/w;return q<.5?Math.pow(q*2,3):Math.pow((1-q)*2,3);}
function shaper(type,x,phase,s){
 const p=((phase/TAU)%1+1)%1,amt1=clamp(s.amount1??s.amount??.35,0,1),amt2=clamp(s.amount2??.25,0,1),amt3=clamp(s.amount3??.20,0,1);
 if(type==="puresynth"){const wf=s.waveform||"sine";let m=1;if(wf==="square")m=pulse(p,clamp((s.pwm??50)/100,.01,.99));else if(wf==="triangle")m=tri(p,clamp((s.peak??50)/100,.02,.98));else if(wf==="saw")m=saw(p);else m=Math.sin(phase);return Math.tanh(x*(1+.8*m));}
 if(type==="quadsynth"){const m=(click(p)+Math.sin(phase)+saw(p)+pulse(p,.5))*.25;return Math.tanh(x*(1+1.2*m));}
 if(type==="pulsynth"){let y=x;for(const [a,ph] of [[amt1,0],[amt2,1/3],[amt3,2/3]])y=Math.tanh(y+pulse(p+ph,clamp((s.pwm??50)/100,.01,.99))*a);return y;}
 if(type==="sinladder"){let y=x;y=Math.tanh(y+Math.sin(phase)*amt1);y=Math.tanh(y+Math.sin(phase*2+2.094)*amt2);y=Math.tanh(y+Math.sin(phase*3+4.188)*amt3);return y;}
 if(type==="razorback"){let y=x;y=Math.tanh(y+tri(p,clamp((s.peak??50)/100,.02,.98))*amt1);y=Math.tanh(y+tri(p+.33,.32)*amt2);y=Math.tanh(y+tri(p+.66,.68)*amt3);return y;}
 if(type==="stinger"){let y=x;y=Math.tanh(y+click(p)*amt1*2);y=Math.tanh(y-click(p+.33)*amt2*2);y=Math.tanh(y+click(p+.66)*amt3*2);return y;}
 if(type==="noquarter"){const trem=.72+.28*Math.sin(phase*.5),ring=.18*Math.sin(phase*1.997);return Math.tanh((x*trem+ring*x)*1.3);}
 return x;
}
function create(type,api){
 const c=api.context,input=c.createGain(),proc=c.createScriptProcessor(256,1,1),master=c.createGain(),output=c.createGain();
 input.connect(proc);proc.connect(master);master.connect(output);api.setInput(input);api.setOutput(output);
 const u={ctx:c,input,proc,master,output,state:api.state,voices:new Map(),phase:0,lastFreq:110};master.gain.value=clamp(api.state.master??.35,0,1);
 proc.onaudioprocess=e=>{const x=e.inputBuffer.getChannelData(0),y=e.outputBuffer.getChannelData(0),s=u.state||{},sr=c.sampleRate;let ph=u.phase,f=u.lastFreq||110;for(let i=0;i<y.length;i++){const v=x[i];y[i]=Math.max(-.95,Math.min(.95,shaper(type,v,ph,s)));ph+=TAU*f/sr;if(ph>TAU)ph-=TAU;}u.phase=ph;};
 return u;
}
function noteOn({runtime,state},note,velocity=127){const u=runtime.user;if(!u?.ctx)return false;const k=String(note);if(u.voices.has(k))return true;const o=u.ctx.createOscillator(),g=u.ctx.createGain(),now=u.ctx.currentTime,f=freq(note);u.lastFreq=f;o.frequency.value=f;o.type=runtime.type==="pulsynth"?"square":runtime.type==="razorback"?"triangle":"sine";g.gain.value=clamp((state.carrier??state.level??.8)*(Number(velocity)/127),0,1);o.connect(g).connect(u.input);o.start(now);u.voices.set(k,{o,g});return true;}
function noteOff({runtime},note){const u=runtime.user,v=u?.voices.get(String(note));if(!v)return false;try{v.o.stop();v.o.disconnect();v.g.disconnect();}catch(_){}u.voices.delete(String(note));return true;}
function panic({runtime}){const u=runtime.user;if(!u)return true;for(const v of u.voices.values())try{v.o.stop();v.o.disconnect();v.g.disconnect();}catch(_){}u.voices.clear();return true;}
function setState({runtime,state}){const u=runtime.user;if(!u)return;u.state=state;u.master.gain.setTargetAtTime(clamp(state.master??.35,0,1),u.ctx.currentTime,.01);}
function destroy({runtime}){panic({runtime});const u=runtime.user;if(!u)return;u.proc.onaudioprocess=null;for(const n of [u.input,u.proc,u.master,u.output])try{n.disconnect();}catch(_){};}
for(const type of types){const [displayName,editorUrl,color,selectorClass,description]=meta[type];C.define({type,displayName,category:"instrument",version:"rack-carrier-1",editorUrl,color,selectorClass,description,defaults:defaults(type),resources:["midi"],create:api=>create(type,api),setState,noteOn,noteOff,panic,destroy,serialize:({state})=>({...state}),restore:({saved})=>({...defaults(type),...(saved||{})})});}
})(window);
