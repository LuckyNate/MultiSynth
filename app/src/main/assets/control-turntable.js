"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const TAU=Math.PI*2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const wrap01=v=>((v%1)+1)%1;
  const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);

  function createState(opts={}){
    return {
      position:clamp(opts.position??0,0,1),
      trackTime:Number(opts.trackTime)||0,
      rate:Number.isFinite(opts.rate)?opts.rate:1,
      trueRate:Number.isFinite(opts.trueRate)?opts.trueRate:1,
      bpm:Number.isFinite(opts.bpm)?opts.bpm:120,
      running:opts.running!==false,
      grabbed:false,
      angle:0,
      turns:0,
      lastAngle:null,
      releaseRate:0,
      role:opts.role==="follower"?"follower":"leader",
      mode:opts.mode==="clamped"?"clamped":"cyclical",
      min:Number.isFinite(opts.min)?opts.min:0,
      max:Number.isFinite(opts.max)?opts.max:1,
      correctionMin:Number.isFinite(opts.correctionMin)?opts.correctionMin:0.10,
      correctionFull:Number.isFinite(opts.correctionFull)?opts.correctionFull:0.15,
      correctionMax:Number.isFinite(opts.correctionMax)?opts.correctionMax:0.20,
      recoveryStrength:Number.isFinite(opts.recoveryStrength)?opts.recoveryStrength:10,
      syncRequested:false
    };
  }

  function valueForPosition(state){return state.min+(state.max-state.min)*state.position}
  function normalizeAngle(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a}
  function angleFromPoint(cx,cy,x,y){return Math.atan2(y-cy,x-cx)}
  function beatSeconds(state){return 60/Math.max(1e-6,state.bpm)}
  function beatPhase(state){return wrap01(state.trackTime/beatSeconds(state))}
  function signedBeatDeltaSeconds(state,target){
    const b=beatSeconds(state),a=beatPhase(state),t=beatPhase(target);
    let d=(t-a)*b;
    if(d>b/2)d-=b;
    if(d<-b/2)d+=b;
    return d;
  }

  function grab(state,angle){state.grabbed=true;state.lastAngle=angle;state.syncRequested=false;return state}
  function drag(state,angle,sensitivity=1,dtSeconds=0){
    if(state.lastAngle==null)state.lastAngle=angle;
    const delta=normalizeAngle(angle-state.lastAngle);
    state.lastAngle=angle;
    const turnDelta=(delta/TAU)*sensitivity;
    state.turns+=turnDelta;
    if(state.mode==="cyclical")state.position=wrap01(state.position+turnDelta);
    else state.position=clamp(state.position+turnDelta,0,1);
    state.angle+=delta;
    if(dtSeconds>0){state.releaseRate=turnDelta/dtSeconds;state.rate=state.releaseRate;state.trackTime+=turnDelta;}
    return {delta,turnDelta,position:state.position,value:valueForPosition(state),rate:state.rate};
  }
  function release(state){state.grabbed=false;state.lastAngle=null;return state}
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
    // Recovery button: first regain corresponding track time, then exact beat phase/rate.
    state.trackTime=leader.trackTime;
    state.position=leader.position;
    state.bpm=leader.bpm;
    state.rate=leader.rate;
    state.syncRequested=false;
    return true;
  }

  function recover(state,target,dtSeconds){
    if(state.grabbed)return state.rate;
    const dt=Math.max(0,Number(dtSeconds)||0);
    const desiredRate=target?target.rate:state.trueRate;
    if(target&&state.role==="follower"){
      const err=signedBeatDeltaSeconds(state,target);
      const w=correctionWeight(err,state);
      const phaseNudge=w?err*Math.max(0.25,state.recoveryStrength):0;
      state.rate=lerp(state.rate,desiredRate+phaseNudge,1-Math.exp(-state.recoveryStrength*dt));
    }else{
      // Leader naturally returns to its own true transport after a scratch.
      state.rate=lerp(state.rate,desiredRate,1-Math.exp(-state.recoveryStrength*dt));
    }
    return state.rate;
  }

  function tick(state,dtSeconds,target=null){
    if(!state.running||state.grabbed)return state.position;
    const dt=Math.max(0,Number(dtSeconds)||0);
    if(state.syncRequested&&target)consumeSync(state,target);
    recover(state,target,dt);
    const delta=dt*state.rate;
    state.trackTime+=delta;
    if(state.mode==="cyclical")state.position=wrap01(state.position+delta);
    else state.position=clamp(state.position+delta,0,1);
    state.angle+=delta*TAU;
    return state.position;
  }

  // Standalone primitive. Pairing is supplied by the future module: leader ticks against itself;
  // follower receives the leader as target. No module, routing, source, or UI assumptions live here.
  MS.TurntableControl=Object.freeze({
    createState,valueForPosition,angleFromPoint,beatSeconds,beatPhase,signedBeatDeltaSeconds,
    grab,drag,release,setRate,setBpm,setRole,setRunning,correctionWeight,
    requestSync,consumeSync,recover,tick
  });
})(window);
