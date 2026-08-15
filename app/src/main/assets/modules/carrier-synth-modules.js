"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const TAU=Math.PI*2,types=["puresynth","quadsynth","pulsynth","sinladder","razorback","stinger","noquarter"];
const meta={puresynth:["PureSynth","puresynth.html","#f4f4f0","pure","MATHEMATICALLY PURE WAVEFORM ENGINE"],quadsynth:["QuadSynth","quadsynth.html","#ffb000","quad","CLICK · SINE · SAW · SQUARE"],pulsynth:["Pulsynth","pulsynth.html","#58ff78","pulse","THREE-STAGE PWM LADDER"],sinladder:["SinLadder","sinladder.html","#36eaff","sine","THREE-STAGE SINE HARMONIC LADDER"],razorback:["Razorback","razorback.html","#ff3d42","saw","TRIANGLE / MOVABLE-PEAK LADDER"],stinger:["Stinger","stinger.html","#ffe64a","stinger","POINTED SPINE CLICK LADDER"],noquarter:["No Quarter","noquarter.html","#77a4ff","noquarter","HAUNTED VELOCITY ELECTRIC PIANO"]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0)),freq=n=>440*Math.pow(2,(Number(n)-69)/12);
function defaults(type){return{master:.35,level:.8,carrier:1,waveform:type==="puresynth"?"sine":null,pwm:50,peak:50,attack:.001,decay:.1,sustain:.75,release:.25,amount1:.35,amount2:.25,amount3:.20,acceleration1:88,acceleration2:92,acceleration3:96,phase1:0,phase2:120,phase3:240,octave1:0,octave2:0,octave3:0,detune1:0,detune2:0,detune3:0,direction1:"up",direction2:"up",direction3:"up"};}
function tri(p,peak=.5){p=((p%1)+1)%1;peak=clamp(peak,.02,.98);return p<peak?-1+2*p/peak:1-2*(p-peak)/(1-peak);}
function pulse(p,duty=.5){p=((p%1)+1)%1;return p<duty?1:-1;}
function saw(p){p=((p%1)+1)%1;return p*2-1;}
function click(p){p=((p%1)+1)%1;const w=.08;if(p>=w)return 0;const q=p/w;return q<.5?Math.pow(q*2,3):Math.pow((1-q)*2,3);}
function spine(p,accel=90,dir="up"){p=((p%1)+1)%1;const d=p<.5?p*2:(1-p)*2,exp=1+Math.pow(clamp(accel,0,100)/100,1.35)*7,v=-1+2*Math.pow(d,exp);return dir==="down"?-v:v;}
function processSample(type,x,phase,s,baseFreq){
 const p=((phase/TAU)%1+1)%1,a1=clamp(s.amount1??s.amount??.35,0,1),a2=clamp(s.amount2??.25,0,1),a3=clamp(s.amount3??.20,0,1);
 if(type==="puresynth"){const wf=s.waveform||"sine";let m=wf==="square"?pulse(p,clamp((s.pwm??50)/100,.01,.99)):wf==="triangle"?tri(p,clamp((s.peak??50)/100,.02,.98)):wf==="saw"?saw(p):Math.sin(phase);return Math.tanh(x*(1+.8*m));}
 if(type==="quadsynth"){const m=(click(p)+Math.sin(phase)+saw(p)+pulse(p,.5))*.25;return Math.tanh(x*(1+1.2*m));}
 if(type==="pulsynth"){let y=x;for(const [a,ph] of [[a1,0],[a2,1/3],[a3,2/3]])y=Math.tanh(y+pulse(p+ph,clamp((s.pwm??50)/100,.01,.99))*a);return y;}
 if(type==="sinladder"){let y=x;y=Math.tanh(y+Math.sin(phase)*a1);y=Math.tanh(y+Math.sin(phase*2+2.094)*a2);y=Math.tanh(y+Math.sin(phase*3+4.188)*a3);return y;}
 if(type==="razorback"){let y=x;y=Math.tanh(y+tri(p,clamp((s.peak??50)/100,.02,.98))*a1);y=Math.tanh(y+tri(p+.33,.32)*a2);y=Math.tanh(y+tri(p+.66,.68)*a3);return y;}
 if(type==="stinger"){let y=x;for(let n=1;n<=3;n++){const oct=Number(s["octave"+n]||0),det=Number(s["detune"+n]||0),ratio=Math.pow(2,oct+det/1200),stagePhase=phase*ratio+(Number(s["phase"+n]||0)*Math.PI/180),amt=clamp(s["amount"+n]??([.35,.25,.20][n-1]),0,1),acc=Number(s["acceleration"+n]??[88,92,96][n-1]),dir=s["direction"+n]||"up";y+=spine(stagePhase/TAU,acc,dir)*amt;}return y;}
 if(type==="noquarter"){const trem=.72+.28*Math.sin(phase*.5),ring=.18*Math.sin(phase*1.997);return Math.tanh((x*trem+ring*x)*1.3);}
 return x;
}
function safeOut(processed,input){if(!Number.isFinite(processed))return input;return Math.max(-.95,Math.min(.95,processed));}
function create(type,api){const c=api.context,input=c.createGain(),proc=c.createScriptProcessor(256,1,1),master=c.createGain(),output=c.createGain();input.connect(proc);proc.connect(master);master.connect(output);api.setInput(input);api.setOutput(output);const u={ctx:c,input,proc,master,output,state:api.state,voices:new Map(),phase:0,lastFreq:110};master.gain.value=clamp(api.state.master??.35,0,1);proc.onaudioprocess=e=>{const x=e.inputBuffer.getChannelData(0),y=e.outputBuffer.getChannelData(0),s=u.state||{},sr=c.sampleRate;let ph=u.phase,f=u.lastFreq||110;for(let i=0;i<y.length;i++){const incoming=x[i];y[i]=safeOut(processSample(type,incoming,ph,s,f),incoming);ph+=TAU*f/sr;if(ph>TAU)ph-=TAU;}u.phase=ph;};return u;}
function noteOn({runtime,state},note,velocity=127){const u=runtime.user;if(!u?.ctx)return false;const k=String(note);if(u.voices.has(k))return true;const o=u.ctx.createOscillator(),g=u.ctx.createGain(),now=u.ctx.currentTime,f=freq(note);u.lastFreq=f;o.frequency.value=f;o.type=runtime.type==="pulsynth"?"square":runtime.type==="razorback"?"triangle":"sine";g.gain.value=clamp((state.carrier??state.level??.8)*(Number(velocity)/127),0,1);o.connect(g).connect(u.input);o.start(now);u.voices.set(k,{o,g});return true;}
function noteOff({runtime},note){const u=runtime.user,v=u?.voices.get(String(note));if(!v)return false;try{v.o.stop();v.o.disconnect();v.g.disconnect();}catch(_){}u.voices.delete(String(note));return true;}
function panic({runtime}){const u=runtime.user;if(!u)return true;for(const v of u.voices.values())try{v.o.stop();v.o.disconnect();v.g.disconnect();}catch(_){}u.voices.clear();return true;}
function setState({runtime,state}){const u=runtime.user;if(!u)return;u.state=state;u.master.gain.setTargetAtTime(clamp(state.master??.35,0,1),u.ctx.currentTime,.01);}
function destroy({runtime}){panic({runtime});const u=runtime.user;if(!u)return;u.proc.onaudioprocess=null;for(const n of [u.input,u.proc,u.master,u.output])try{n.disconnect();}catch(_){};}
for(const type of types){const [displayName,editorUrl,color,selectorClass,description]=meta[type];C.define({type,displayName,category:"instrument",version:"rack-carrier-2",editorUrl,color,selectorClass,description,defaults:defaults(type),resources:["midi"],create:api=>create(type,api),setState,noteOn,noteOff,panic,destroy,serialize:({state})=>({...state}),restore:({saved})=>({...defaults(type),...(saved||{})})});}
})(window);
