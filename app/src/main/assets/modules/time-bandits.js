"use strict";
(function(global){
  const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,RS=MS.ModuleStandard,D=MS.DspSources;
  if(!C||!I||!RS||!D)return;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const BASE=[
    {name:"SUB",pitch:42,decay:1200,bend:-700,tone:28,character:65,level:88,kind:"sub"},
    {name:"KICK",pitch:58,decay:520,bend:-1500,tone:52,character:72,level:92,kind:"kick"},
    {name:"SNARE",pitch:190,decay:360,bend:-250,tone:68,character:72,level:80,kind:"snare"},
    {name:"TOM 1",pitch:130,decay:720,bend:-380,tone:52,character:38,level:80,kind:"tom"},
    {name:"TOM 2",pitch:205,decay:720,bend:-380,tone:52,character:38,level:80,kind:"tom"},
    {name:"TOM 3",pitch:320,decay:720,bend:-380,tone:52,character:38,level:80,kind:"tom"},
    {name:"CRASH",pitch:520,decay:1450,bend:0,tone:76,character:70,level:68,kind:"crash"},
    {name:"RIDE",pitch:760,decay:1900,bend:0,tone:70,character:58,level:66,kind:"ride"},
    {name:"CHINA",pitch:620,decay:1250,bend:-120,tone:62,character:84,level:68,kind:"china"},
    {name:"HAT CLOSED",pitch:1250,decay:90,bend:0,tone:88,character:65,level:62,kind:"hatc"},
    {name:"HAT OPEN",pitch:1250,decay:650,bend:0,tone:88,character:65,level:60,kind:"hato"},
    {name:"TAMBOURINE",pitch:900,decay:420,bend:0,tone:82,character:80,level:64,kind:"tamb"},
    {name:"CLAP",pitch:1100,decay:330,bend:0,tone:72,character:62,level:72,kind:"clap"},
    {name:"COWBELL",pitch:587,decay:360,bend:0,tone:56,character:62,level:72,kind:"cowbell"},
    {name:"CLAVE",pitch:1250,decay:70,bend:0,tone:66,character:45,level:74,kind:"clave"},
    {name:"RIMSHOT",pitch:455,decay:85,bend:0,tone:78,character:72,level:74,kind:"rimshot"}
  ];
  const PARAMS=["pitch","decay","bend","tone","character","level"];
  const LANE_KEYS=["subSteps","kickSteps","snareSteps","tom1Steps","tom2Steps","tom3Steps","cymbal1Steps","cymbal2Steps","cymbal3Steps","hatClosedSteps","hatOpenSteps","tambourineSteps"];
  const pat=()=>BASE.map(()=>Array(32).fill(0));
  const prob=()=>BASE.map(()=>Array(32).fill(100));
  const voiceState=(saved,i)=>{const b=BASE[i]||BASE[0],s=saved||{},v={};for(const k of PARAMS)v[k]=Number.isFinite(Number(s[k]))?Number(s[k]):b[k];return v};
  const normalizeVoices=state=>{state.voices=BASE.map((_,i)=>voiceState(state.voices?.[i],i));return state.voices};
  const defaults=()=>({bpm:120,swing:0,steps:32,running:false,pattern:pat(),probabilities:prob(),voices:BASE.map((_,i)=>voiceState(null,i)),selected:0});

  function normalizePattern(state){
    if(Array.isArray(state.pattern)){
      state.pattern=BASE.map((_,i)=>Array.from({length:32},(_,s)=>state.pattern?.[i]?.[s]?1:0));
      return state.pattern;
    }
    const migrated=pat();
    for(let i=0;i<LANE_KEYS.length;i++)if(Array.isArray(state[LANE_KEYS[i]]))migrated[i]=Array.from({length:32},(_,s)=>state[LANE_KEYS[i]][s]?1:0);
    state.pattern=migrated;
    return migrated;
  }

  function normalizeProbabilities(state){
    const src=state.probabilities;
    state.probabilities=BASE.map((_,i)=>Array.from({length:32},(_,s)=>clamp(Array.isArray(src?.[i])?src[i][s]??100:100,0,100)));
    return state.probabilities;
  }

  function canonicalVoice(state,i){return{...BASE[i],...voiceState(state?.voices?.[i],i),name:BASE[i].name,kind:BASE[i].kind}}
  function envGain(c,level,t,dur,peak=1){const g=c.createGain();g.gain.setValueAtTime(Math.max(.0001,level*peak),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);return g}
  function pitched(u,v,t,w="sine",amp=.7,bendScale=1,detune=0){const dur=Math.max(.02,v.decay/1000),base=Math.max(10,v.pitch),o=D.oscillator(u.ctx,w,base),g=envGain(u.ctx,v.level/100,t,dur,amp),bend=Number(v.bend||0)*bendScale,start=Math.max(10,base*Math.pow(2,-bend/1200));try{o.detune?.setValueAtTime(detune,t);o.frequency?.setValueAtTime(start,t);o.frequency?.exponentialRampToValueAtTime(base,t+Math.min(dur*.32,.12))}catch(_){}o.connect(g).connect(u.drums);o.start(t);o.stop(t+dur+.08)}
  function filteredNoise(u,v,t,amp=.35,type="highpass",freq=null,durScale=1){const dur=Math.max(.025,v.decay/1000*durScale),s=D.noise(u.ctx,"white",dur,false),f=u.ctx.createBiquadFilter(),g=envGain(u.ctx,v.level/100,t,dur,amp);f.type=type;const tone=clamp(v.tone,0,100)/100;f.frequency.value=freq??(type==="lowpass"?400+tone*9000:300+tone*10500);f.Q.value=.5+clamp(v.character,0,100)/100*4;s.connect(f).connect(g).connect(u.drums);s.start(t);s.stop(t+dur)}
  function transient(u,v,t,amp=.2){const c=u.ctx,n=Math.max(24,Math.floor(c.sampleRate*(.002+clamp(v.character,0,100)/100*.01))),b=D.shapedBuffer(c,n,(i,len)=>{const e=1-i/len;return(Math.random()*2-1)*e*e}),s=D.bufferSource(c,b),hp=c.createBiquadFilter(),g=envGain(c,v.level/100,t,.015,amp);hp.type="highpass";hp.frequency.value=1200+clamp(v.tone,0,100)/100*7000;s.connect(hp).connect(g).connect(u.drums);s.start(t)}
  function metal(u,v,t,ratios,noiseAmp=.2,oscAmp=.05,type="square"){const ch=clamp(v.character,0,100)/100;for(let k=0;k<ratios.length;k++)pitched(u,{...v,pitch:v.pitch*ratios[k],level:v.level*(.42+ch*.18)},t,k%2?type:"triangle",oscAmp,0,(k-ratios.length/2)*6);if(noiseAmp)filteredNoise(u,v,t,noiseAmp,"highpass",1400+v.tone*90,1)}
  function clap(u,v,t,ch){const c=u.ctx,tone=clamp(v.tone,0,100)/100,base=900+tone*1500,spread=.011+ch*.008,level=v.level/100;for(let k=0;k<3;k++){const dur=.018+ch*.012,s=D.noise(c,"white",dur,false),bp=c.createBiquadFilter(),hp=c.createBiquadFilter(),g=envGain(c,level,t+k*spread,dur,.36-k*.035);bp.type="bandpass";bp.frequency.value=base+(k-1)*180;bp.Q.value=.65+ch*.75;hp.type="highpass";hp.frequency.value=450+tone*650;s.connect(bp).connect(hp).connect(g).connect(u.drums);s.start(t+k*spread);s.stop(t+k*spread+dur)}const tailDur=Math.max(.08,v.decay/1000),tail=D.noise(c,"white",tailDur,false),tailBp=c.createBiquadFilter(),tailHp=c.createBiquadFilter(),tailGain=envGain(c,level,t+spread*2.2,tailDur,.28);tailBp.type="bandpass";tailBp.frequency.value=base*.92;tailBp.Q.value=.45+ch*.45;tailHp.type="highpass";tailHp.frequency.value=500+tone*800;tail.connect(tailBp).connect(tailHp).connect(tailGain).connect(u.drums);tail.start(t+spread*2.2);tail.stop(t+spread*2.2+tailDur);transient(u,{...v,tone:Math.max(35,v.tone-18),character:35},t,.07)}
  function synthHit(u,i,t){const v=canonicalVoice(u.state,i),ch=clamp(v.character,0,100)/100;if(v.kind==="sub"){pitched(u,v,t,"sine",.92,.7);if(ch>.55)pitched(u,{...v,pitch:v.pitch*2,decay:v.decay*.35,level:v.level*(ch-.45)},t,"sine",.18,.3)}else if(v.kind==="kick"){pitched(u,v,t,"sine",.95,1);transient(u,v,t,.08+ch*.24);if(ch>.72)filteredNoise(u,{...v,decay:Math.min(v.decay,90)},t,.08,"highpass",1800+v.tone*55,.25)}else if(v.kind==="snare"){pitched(u,v,t,"triangle",.28,.28,-7);pitched(u,{...v,pitch:v.pitch*1.62,decay:v.decay*.72},t,"sine",.18,.12,9);filteredNoise(u,v,t,.18+ch*.55,"highpass",900+v.tone*70,1);transient(u,v,t,.06+ch*.16)}else if(v.kind==="tom"){pitched(u,v,t,"sine",.76,.65);pitched(u,{...v,pitch:v.pitch*1.48,decay:v.decay*.55,level:v.level*(.35+ch*.25)},t,"triangle",.18,.22)}else if(v.kind==="crash"){metal(u,v,t,[1,1.342,1.731,2.117,2.693,3.417],.58+ch*.22,.025);filteredNoise(u,{...v,decay:v.decay*.72},t,.42,"bandpass",3300+v.tone*52,.9);filteredNoise(u,v,t,.24,"highpass",5200+v.tone*38,1);transient(u,v,t,.15)}else if(v.kind==="ride"){metal(u,v,t,[1,1.48,1.93,2.56,3.21],.34+ch*.14,.022,"square");filteredNoise(u,v,t,.28,"highpass",4200+v.tone*45,1);filteredNoise(u,{...v,decay:v.decay*.62},t,.16,"bandpass",6200+v.tone*32,.8);pitched(u,{...v,pitch:v.pitch*2.72,decay:v.decay*.5},t,"sine",.11,0);transient(u,{...v,tone:Math.min(100,v.tone+18)},t,.2+ch*.08)}else if(v.kind==="china"){metal(u,v,t,[.72,1,1.29,1.83,2.41,3.08],.55+ch*.2,.028,"square");filteredNoise(u,v,t,.38,"bandpass",2200+v.tone*42,1);filteredNoise(u,{...v,decay:v.decay*.58},t,.22,"highpass",4800+v.tone*32,.75);pitched(u,{...v,pitch:v.pitch*.58,decay:v.decay*.55},t,"triangle",.08,.2);transient(u,v,t,.2)}else if(v.kind==="hatc"||v.kind==="hato"){metal(u,v,t,[1,1.342,1.731,2.117,2.693,3.417],.3+ch*.12,.02);filteredNoise(u,v,t,.34,"highpass",3900+v.tone*68,v.kind==="hatc"?.6:1);transient(u,{...v,decay:Math.min(v.decay,55)},t,.08+ch*.06)}else if(v.kind==="tamb"){for(const r of [1,1.57,2.23,3.11])pitched(u,{...v,pitch:v.pitch*r,decay:v.decay*(.45+Math.random()*.45),level:v.level*.5},t,"square",.055,0);filteredNoise(u,v,t,.24+ch*.22,"bandpass",2500+v.tone*70,.8);transient(u,v,t,.12)}else if(v.kind==="clap")clap(u,v,t,ch);else if(v.kind==="cowbell"){const ratio=1.44+(ch-.5)*.12;pitched(u,{...v,decay:v.decay*.82},t,"square",.36,0);pitched(u,{...v,pitch:v.pitch*ratio,decay:v.decay,level:v.level*.95},t,"square",.4,0);filteredNoise(u,{...v,decay:Math.min(70,v.decay)},t,.04,"bandpass",v.pitch*1.2,.25)}else if(v.kind==="clave"){pitched(u,{...v,pitch:v.pitch*2,decay:Math.min(140,v.decay),level:v.level},t,"triangle",.82,.08);pitched(u,{...v,pitch:v.pitch*2.34,decay:Math.min(80,v.decay*.65),level:v.level*(.2+ch*.25)},t,"sine",.2,0);transient(u,{...v,tone:Math.min(100,v.tone+12)},t,.05)}else if(v.kind==="rimshot"){pitched(u,{...v,decay:Math.min(120,v.decay)},t,"triangle",.48,.06);pitched(u,{...v,pitch:v.pitch*3.66,decay:Math.min(70,v.decay*.75),level:v.level},t,"triangle",.36,0);filteredNoise(u,{...v,decay:35},t,.08+ch*.08,"highpass",1800+v.tone*50,.35);transient(u,v,t,.18)}}

  async function renderVoice(voice,index=0){const O=global.OfflineAudioContext||global.webkitOfflineAudioContext;if(!O)return null;index=Math.max(0,Math.min(BASE.length-1,Math.round(Number(index)||0)));const canonical={...BASE[index],...voiceState(voice,index),name:BASE[index].name,kind:BASE[index].kind},sampleRate=44100,duration=Math.min(4,Math.max(.18,Number(canonical.decay||250)/1000+.22)),c=new O(1,Math.ceil(sampleRate*duration),sampleRate),drums=c.createGain();drums.connect(c.destination);const voices=BASE.map((_,i)=>voiceState(i===index?canonical:null,i)),u={ctx:c,drums,state:{voices}};synthHit(u,index,.005);const b=await c.startRendering();return new Float32Array(b.getChannelData(0))}
  function bufferFromPcm(c,pcm,sampleRate=44100){const b=c.createBuffer(1,pcm.length,sampleRate);b.copyToChannel(pcm,0);return b}
  function playCached(u,i,t){const b=u.buffers?.[i];if(!b)return false;const s=D.bufferSource(u.ctx,b,false);s.connect(u.drums);s.start(t);return true}
  function hit(u,i,t){if(!playCached(u,i,t))synthHit(u,i,t)}
  async function renderAndCache(u,i,save=true){const token=(u.renderTokens[i]||0)+1;u.renderTokens[i]=token;const pcm=await renderVoice(u.state.voices?.[i],i);if(!pcm||u.renderTokens[i]!==token)return null;u.buffers[i]=bufferFromPcm(u.ctx,pcm,44100);if(save&&MS.PCMLibrary?.save){const old=u.sampleIds[i];try{const rec=await MS.PCMLibrary.save({id:old||undefined,name:`TIME BANDITS · ${BASE[i].name}`,data:pcm,sampleRate:44100,source:"time-bandits",tags:["time-bandits",BASE[i].kind],folder:"time-bandits"});u.sampleIds[i]=rec.id}catch(e){console.error("Time Bandits PCM save",e)}}return pcm}
  async function hydrate(u){const ids=u.state.sampleIds||[],tasks=BASE.map(async(_,i)=>{const id=ids[i];if(id&&MS.PCMLibrary?.get){try{const rec=await MS.PCMLibrary.get(id);if(rec?.data?.length){u.sampleIds[i]=id;u.buffers[i]=bufferFromPcm(u.ctx,rec.data,rec.sampleRate||44100);return}}catch(e){console.error("Time Bandits PCM restore",e)}}await renderAndCache(u,i,true)});await Promise.all(tasks);u.state.sampleIds=[...u.sampleIds]}

  function eventList(state,startStep){
    const pattern=normalizePattern(state),chances=normalizeProbabilities(state),len=Math.max(1,Math.min(32,Math.round(Number(state.steps)||32))),events=[];
    for(let d=0;d<len;d++){
      const step=(startStep+d)%len;
      for(let voice=0;voice<pattern.length;voice++)if(pattern[voice]?.[step])events.push({voice,step,chance:chances[voice][step]});
    }
    return events;
  }

  function roll(chance){return Math.random()*100<chance}

  function primeProbabilityQueue(u,startStep){
    u.probabilityEvents=eventList(u.state,startStep);
    u.probabilityCursor=0;
    u.probabilityQueue=[];
    for(let i=0;i<4;i++){
      const e=u.probabilityEvents[u.probabilityCursor%Math.max(1,u.probabilityEvents.length)];
      u.probabilityQueue.push(e?roll(e.chance):false);
      if(e)u.probabilityCursor++;
    }
  }

  function nextProbabilityRoll(u){
    const events=u.probabilityEvents||[];
    if(!events.length)return false;
    const e=events[u.probabilityCursor%events.length];
    u.probabilityCursor++;
    return roll(e.chance);
  }

  function fire(u,step,t){
    const pattern=normalizePattern(u.state);
    if(!u.probabilityQueue?.length)primeProbabilityQueue(u,step);
    for(let voice=0;voice<pattern.length;voice++){
      if(!pattern[voice]?.[step])continue;
      const shouldHit=Boolean(u.probabilityQueue.shift());
      u.probabilityQueue.push(nextProbabilityRoll(u));
      if(shouldHit)hit(u,voice,t);
    }
  }

  function audition(u){if(u.state.running)return;const i=Math.max(0,Math.min(BASE.length-1,Math.round(Number(u.state.selected)||0)));hit(u,i,u.ctx.currentTime+.005)}
  async function renderPreview(voice,index=0){return renderVoice(voice,index)}

  function create(api){
    const c=api.context,input=c.createGain(),drums=c.createGain(),mix=c.createGain(),output=c.createGain();
    normalizePattern(api.state);normalizeProbabilities(api.state);normalizeVoices(api.state);
    input.connect(mix);drums.connect(mix);mix.connect(output);api.setInput(input);api.setOutput(output);
    const u={id:api.instanceId,ctx:c,input,drums,mix,output,state:api.state,transport:null,cvStep:0,auditionTimer:0,buffers:Array(BASE.length).fill(null),sampleIds:Array.from({length:BASE.length},(_,i)=>api.state.sampleIds?.[i]||null),renderTokens:Array(BASE.length).fill(0),probabilityQueue:[],probabilityEvents:[],probabilityCursor:0};
    primeProbabilityQueue(u,0);
    u.transport=RS.transport(c,{getState:()=>u.state,onStep:(st,t,meta)=>{fire(u,st,t);if(!meta?.external&&st%4===0)MS.CvBus?.send(u.id,{kind:"trigger",value:1,gate:true,bpm:Number(u.state.bpm)||120,substep:st,beat:Math.floor(st/4),time:t})},maxSteps:32});
    hydrate(u).catch(e=>console.error("Time Bandits PCM hydrate",e));
    if(api.state.running)u.transport.start();
    return u;
  }

  function setState({runtime,state,patch}){
    const u=runtime.user;if(!u)return;
    normalizePattern(state);normalizeProbabilities(state);normalizeVoices(state);u.state=state;
    if("pattern" in patch||"probabilities" in patch||"steps" in patch)u.probabilityQueue=[];
    if("voices" in patch){const targets=[Math.max(0,Math.min(BASE.length-1,Math.round(Number(state.selected)||0)))];for(const i of targets)renderAndCache(u,i,true).then(()=>{state.sampleIds=[...u.sampleIds]}).catch(e=>console.error("Time Bandits PCM render",e))}
    if("running" in patch){state.running?u.transport.start():u.transport.stop();if(!state.running)audition(u)}
    if(!state.running&&("selected" in patch||"voices" in patch||"auditionNonce" in patch)){clearTimeout(u.auditionTimer);u.auditionTimer=setTimeout(()=>audition(u),18)}
  }

  function trigger({runtime,state},packet={}){
    const u=runtime.user;if(!u?.ctx)return false;
    const len=Math.max(1,Math.min(32,Math.round(Number(state.steps)||32))),start=u.cvStep%len,base=Number(packet.time)||u.ctx.currentTime,sixteenth=60/Math.max(20,Math.min(300,Number(state.bpm)||120))/4;
    if(!u.probabilityQueue?.length)primeProbabilityQueue(u,start);
    for(let n=0;n<4;n++){const st=(start+n)%len;fire(u,st,base+n*sixteenth)}
    u.cvStep=(start+4)%len;
    return true;
  }

  function clockStart({runtime}){const u=runtime.user;if(u){u.cvStep=0;primeProbabilityQueue(u,0)}u?.transport.clockStart()}
  function clockStop({runtime}){runtime.user?.transport.clockStop()}
  function clockTick({runtime},tick){return runtime.user?.transport.clockTick(tick)??false}
  function destroy({runtime}){const u=runtime.user;if(!u)return;clearTimeout(u.auditionTimer);u.transport.destroy();for(const n of [u.input,u.drums,u.mix,u.output])try{n.disconnect()}catch(_){}}

  MS.TimeBanditsPreview=Object.freeze({render:renderPreview});
  C.define({type:I.TIME_BANDITS,version:"module-builder-15",description:"BEAT RED 16-VOICE 32-STEP DRUM SYNTH WITH FOUR-ROLL PREQUEUED TRIGGER PROBABILITY",defaults:defaults(),resources:["midi","storage"],create,setState,trigger,clockStart,clockStop,clockTick,destroy});
})(window);
