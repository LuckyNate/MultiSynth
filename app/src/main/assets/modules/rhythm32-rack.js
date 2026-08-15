"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const BASE=[
{name:"SUB",pitch:42,decay:1200,bend:-700,tone:28,character:65,level:88,kind:"sub"},
{name:"KICK",pitch:58,decay:520,bend:-1500,tone:52,character:72,level:92,kind:"kick"},
{name:"SNARE",pitch:190,decay:360,bend:-250,tone:68,character:72,level:80,kind:"snare"},
{name:"TOM 1",pitch:130,decay:720,bend:-380,tone:52,character:38,level:80,kind:"tom"},
{name:"TOM 2",pitch:205,decay:720,bend:-380,tone:52,character:38,level:80,kind:"tom"},
{name:"TOM 3",pitch:320,decay:720,bend:-380,tone:52,character:38,level:80,kind:"tom"},
{name:"CYMBAL 1",pitch:520,decay:1100,bend:0,tone:72,character:50,level:68,kind:"cym"},
{name:"CYMBAL 2",pitch:760,decay:1400,bend:0,tone:76,character:62,level:66,kind:"cym"},
{name:"CYMBAL 3",pitch:1050,decay:1800,bend:0,tone:82,character:72,level:64,kind:"cym"},
{name:"HAT CLOSED",pitch:1250,decay:90,bend:0,tone:88,character:65,level:62,kind:"hatc"},
{name:"HAT OPEN",pitch:1250,decay:650,bend:0,tone:88,character:65,level:60,kind:"hato"},
{name:"TAMBOURINE",pitch:900,decay:420,bend:0,tone:82,character:80,level:64,kind:"tamb"}
];
const pattern=()=>BASE.map(()=>Array(32).fill(0));
const defaults=()=>({bpm:120,swing:0,steps:32,syncMode:"internal",running:false,pattern:pattern(),voices:BASE.map(v=>({...v})),selected:0});
function oscHit(u,v,t,wave="sine",mul=1,amp=.5){const c=u.ctx,o=c.createOscillator(),g=c.createGain();o.type=wave;o.frequency.setValueAtTime(Math.max(10,v.pitch*mul),t);if(v.bend){const end=Math.max(10,v.pitch*mul*Math.pow(2,v.bend/1200));o.frequency.exponentialRampToValueAtTime(end,t+Math.min(.25,v.decay/2000));}g.gain.setValueAtTime(Math.max(.0001,v.level/100*amp),t);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.02,v.decay/1000));o.connect(g).connect(u.drums);o.start(t);o.stop(t+v.decay/1000+.08);}
function noise(u,v,t,scale=1){const c=u.ctx,dur=Math.max(.03,v.decay/1000*scale),n=Math.max(64,Math.floor(c.sampleRate*dur)),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type=v.kind==="snare"?"bandpass":"highpass";f.frequency.value=Math.min(12000,Math.max(200,v.pitch*(1+v.tone/20)));f.Q.value=.8;g.gain.setValueAtTime(Math.max(.0001,v.level/100*.35),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f).connect(g).connect(u.drums);s.start(t);}
function hit(u,i,t){const v=(u.state.voices||BASE)[i]||BASE[i];if(!v)return;if(v.kind==="sub"){oscHit(u,v,t,"sine",1,.85);oscHit(u,{...v,pitch:Math.max(18,v.pitch*.5),bend:0},t,"sine",1,.45);}else if(v.kind==="kick")oscHit(u,v,t,"sine",1,.9);else if(v.kind==="snare"){oscHit(u,v,t,"triangle",1,.25);noise(u,v,t,1);}else if(v.kind==="tom")oscHit(u,v,t,"sine",1,.75);else if(v.kind==="cym"||v.kind==="hatc"||v.kind==="hato"||v.kind==="tamb"){for(let k=0;k<(v.kind==="cym"?6:4);k++)oscHit(u,{...v,pitch:v.pitch*(1.15+k*.47),bend:0,level:v.level*.5},t+(v.kind==="tamb"?k*.01:0),"square",1,.12);noise(u,v,t,v.kind==="hatc"?.35:1);}}
function stepDur(s,idx){const base=60/clamp(s.bpm??120,30,300)/4,sw=clamp(s.swing??0,0,100)/100;return base*(idx%2?1+sw*.5:1-sw*.5);}
function schedule(u){if(!u.state.running||u.state.syncMode==="external"){u.timer=null;return;}const c=u.ctx,h=c.currentTime+.12,len=clamp(Math.round(u.state.steps??32),1,32),pat=u.state.pattern||pattern();while(u.next<h){const st=u.step%len;for(let i=0;i<pat.length;i++)if(pat[i]?.[st])hit(u,i,u.next);u.next+=stepDur(u.state,st);u.step=(st+1)%len;}u.timer=setTimeout(()=>schedule(u),25);}
function start(u){if(u.state.running&&u.timer)return;u.state.running=true;u.step=0;u.next=u.ctx.currentTime+.03;if(u.state.syncMode!=="external")schedule(u);}
function stop(u){u.state.running=false;if(u.timer)clearTimeout(u.timer);u.timer=null;}
function create(api){const c=api.context,input=c.createGain(),drums=c.createGain(),mix=c.createGain(),output=c.createGain();input.connect(mix);drums.connect(mix);mix.connect(output);drums.gain.value=.8;api.setInput(input);api.setOutput(output);const u={ctx:c,input,drums,mix,output,state:api.state,timer:null,step:0,next:0};if(api.state.running)start(u);return u;}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;u.state=state;if("running" in patch){state.running?start(u):stop(u);}else if(state.running&&(patch.bpm!==undefined||patch.swing!==undefined||patch.steps!==undefined)){if(u.timer)clearTimeout(u.timer);u.timer=null;u.next=u.ctx.currentTime+.03;schedule(u);}}
function destroy({runtime}){const u=runtime.user;if(!u)return;stop(u);for(const n of [u.input,u.drums,u.mix,u.output])try{n.disconnect();}catch(_){}}
C.define({type:"rhythm32",displayName:"Rhythm32",category:"sequencer",version:"rack-persistent-1",editorUrl:"rhythm32.html",color:"#f4f4f0",selectorClass:"rhythm",description:"32-STEP DRUM SYNTH · PATTERN · SYNC",defaults:defaults(),resources:["midi","storage"],create,setState,destroy,serialize:({state})=>JSON.parse(JSON.stringify(state)),restore:({saved})=>Object.assign(defaults(),saved||{})});
})(window);
