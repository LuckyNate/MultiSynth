"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const wrap01=v=>((v%1)+1)%1;
  const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);

  function createState(opts={}){
    const position=clamp(opts.position??0,0,Number.MAX_SAFE_INTEGER);
    return {
      position,
      trackTime:Number(opts.trackTime)||0,
      rate:Number.isFinite(opts.rate)?opts.rate:1,
      trueRate:Number.isFinite(opts.trueRate)?opts.trueRate:1,
      bpm:Number.isFinite(opts.bpm)?opts.bpm:120,
      running:opts.running!==false,
      role:opts.role==="follower"?"follower":"leader",
      correctionMin:Number.isFinite(opts.correctionMin)?opts.correctionMin:0.10,
      correctionFull:Number.isFinite(opts.correctionFull)?opts.correctionFull:0.15,
      correctionMax:Number.isFinite(opts.correctionMax)?opts.correctionMax:0.20,
      recoveryStrength:Number.isFinite(opts.recoveryStrength)?opts.recoveryStrength:10,
      syncRequested:false,
      secondsPerTurn:Math.max(.05,Number(opts.secondsPerTurn)||1.8),
      scratching:false,
      scratchPosition:position,
      scratchRate:0,
      scratchDirection:0,
      scratchDeltaRadians:0,
      scratchAngularVelocity:0
    };
  }

  function beatSeconds(state){return 60/Math.max(1e-6,state.bpm)}
  function beatPhase(state){return wrap01(state.trackTime/beatSeconds(state))}
  function signedBeatDeltaSeconds(state,target){
    const b=beatSeconds(state),a=beatPhase(state),t=beatPhase(target);
    let d=(t-a)*b;
    if(d>b/2)d-=b;
    if(d<-b/2)d+=b;
    return d;
  }
  function setRate(state,rate){state.rate=Number(rate)||0;return state.rate}
  function setBpm(state,bpm){state.bpm=Math.max(1e-6,Number(bpm)||120);return state.bpm}
  function setRole(state,role){state.role=role==="follower"?"follower":"leader";return state.role}
  function setRunning(state,running){state.running=!!running;return state.running}

  // Human timing remains authoritative. Only the 100-200 ms band is gently cleaned up.
  function correctionWeight(errorSeconds,state){
    const e=Math.abs(errorSeconds);
    if(e<=state.correctionMin||e>=state.correctionMax)return 0;
    if(e<=state.correctionFull)return (e-state.correctionMin)/(state.correctionFull-state.correctionMin);
    return (state.correctionMax-e)/(state.correctionMax-state.correctionFull);
  }

  function requestSync(state){state.syncRequested=true;return true}
  function consumeSync(state,leader){
    if(!state.syncRequested||!leader)return false;
    state.trackTime=leader.trackTime;
    state.position=leader.position;
    state.bpm=leader.bpm;
    state.rate=leader.rate;
    state.syncRequested=false;
    return true;
  }

  function recover(state,target,dtSeconds){
    const dt=Math.max(0,Number(dtSeconds)||0);
    const desiredRate=target?target.rate:state.trueRate;
    if(target&&state.role==="follower"){
      const err=signedBeatDeltaSeconds(state,target);
      const w=correctionWeight(err,state);
      const phaseNudge=w?err*Math.max(0.25,state.recoveryStrength):0;
      state.rate=lerp(state.rate,desiredRate+phaseNudge,1-Math.exp(-state.recoveryStrength*dt));
    }else{
      state.rate=lerp(state.rate,desiredRate,1-Math.exp(-state.recoveryStrength*dt));
    }
    return state.rate;
  }

  function tick(state,dtSeconds,target=null){
    if(!state.running||state.scratching)return state.position;
    const dt=Math.max(0,Number(dtSeconds)||0);
    if(state.syncRequested&&target)consumeSync(state,target);
    recover(state,target,dt);
    const delta=dt*state.rate;
    state.trackTime+=delta;
    state.position=wrap01(state.position+delta);
    return state.position;
  }

  function beginScratch(state,position=state.position){
    const p=Math.max(0,Number(position)||0);
    state.scratching=true;
    state.position=p;
    state.scratchPosition=p;
    state.scratchRate=0;
    state.scratchDirection=0;
    state.scratchDeltaRadians=0;
    state.scratchAngularVelocity=0;
    return state;
  }

  function applyScratchGesture(state,phase,detail={}){
    const p=Math.max(0,Number(detail.position??state.scratchPosition??state.position)||0);
    const rate=Number(detail.rate)||0;
    const delta=Number(detail.deltaRadians)||0;
    if(phase==="press")return beginScratch(state,p);
    state.position=p;
    state.scratchPosition=p;
    state.scratchRate=rate;
    state.scratchDirection=Number(detail.direction)||Math.sign(rate);
    state.scratchDeltaRadians=delta;
    state.scratchAngularVelocity=state.secondsPerTurn>0?rate/state.secondsPerTurn*Math.PI*2:0;
    if(phase==="release"||phase==="cancel"){
      state.scratching=false;
      state.scratchRate=0;
      state.scratchDirection=0;
      state.scratchAngularVelocity=0;
    }else state.scratching=true;
    return state;
  }

  function endScratch(state,position=state.scratchPosition){
    state.position=Math.max(0,Number(position)||0);
    state.scratchPosition=state.position;
    state.scratching=false;
    state.scratchRate=0;
    state.scratchDirection=0;
    state.scratchDeltaRadians=0;
    state.scratchAngularVelocity=0;
    return state;
  }

  function createScratchEngine(ctx,output,opts={}){
    if(!ctx||!output||typeof ctx.createScriptProcessor!=="function")return null;
    const size=[256,512,1024,2048].includes(Number(opts.bufferSize))?Number(opts.bufferSize):256;
    const processor=ctx.createScriptProcessor(size,0,2);
    let buffer=null,active=false,playhead=0,target=0,rate=0,lastMove=0;
    const sampleAt=(channel,index)=>{
      if(!buffer)return 0;
      const data=buffer.getChannelData(Math.min(channel,buffer.numberOfChannels-1)),i0=Math.max(0,Math.min(data.length-1,Math.floor(index))),i1=Math.max(0,Math.min(data.length-1,i0+1)),f=index-i0;
      return data[i0]+(data[i1]-data[i0])*f;
    };
    processor.onaudioprocess=e=>{
      const outs=[];for(let c=0;c<e.outputBuffer.numberOfChannels;c++)outs.push(e.outputBuffer.getChannelData(c));
      if(!active||!buffer){for(const out of outs)out.fill(0);return}
      const stale=Math.max(0,ctx.currentTime-lastMove),signedRate=stale>.055?0:rate,step=signedRate*buffer.sampleRate/ctx.sampleRate;
      const error=target-playhead;
      if(Math.abs(error)>buffer.sampleRate*.045)playhead=target;else playhead+=error*.18;
      const audible=Math.abs(signedRate)>.002;
      for(let i=0;i<e.outputBuffer.length;i++){
        if(!audible||playhead<0||playhead>=buffer.length-1){for(const out of outs)out[i]=0;continue}
        for(let c=0;c<outs.length;c++)outs[c][i]=sampleAt(c,playhead);
        playhead+=step;
      }
    };
    processor.connect(output);
    return {
      setBuffer(next){buffer=next||null;if(buffer){playhead=Math.max(0,Math.min(buffer.length-1,target))}return this},
      begin(position=0){if(!buffer)return false;active=true;rate=0;target=playhead=Math.max(0,Math.min(buffer.length-1,(Number(position)||0)*buffer.sampleRate));lastMove=ctx.currentTime;return true},
      move(position=0,signedRate=0){if(!buffer||!active)return false;target=Math.max(0,Math.min(buffer.length-1,(Number(position)||0)*buffer.sampleRate));rate=Number(signedRate)||0;lastMove=ctx.currentTime;return true},
      end(position=0){if(buffer)target=playhead=Math.max(0,Math.min(buffer.length-1,(Number(position)||0)*buffer.sampleRate));active=false;rate=0;return true},
      stop(){active=false;rate=0;return true},
      disconnect(){active=false;rate=0;processor.onaudioprocess=null;try{processor.disconnect()}catch(_){}},
      get position(){return buffer?playhead/buffer.sampleRate:0},
      get active(){return active}
    };
  }

  MS.TurntableControl=Object.freeze({
    createState,beatSeconds,beatPhase,signedBeatDeltaSeconds,
    setRate,setBpm,setRole,setRunning,correctionWeight,
    requestSync,consumeSync,recover,tick,
    beginScratch,applyScratchGesture,endScratch,createScratchEngine
  });
})(window);
