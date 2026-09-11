"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
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
      role:opts.role==="follower"?"follower":"leader",
      correctionMin:Number.isFinite(opts.correctionMin)?opts.correctionMin:0.10,
      correctionFull:Number.isFinite(opts.correctionFull)?opts.correctionFull:0.15,
      correctionMax:Number.isFinite(opts.correctionMax)?opts.correctionMax:0.20,
      recoveryStrength:Number.isFinite(opts.recoveryStrength)?opts.recoveryStrength:10,
      syncRequested:false
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
    if(!state.running)return state.position;
    const dt=Math.max(0,Number(dtSeconds)||0);
    if(state.syncRequested&&target)consumeSync(state,target);
    recover(state,target,dt);
    const delta=dt*state.rate;
    state.trackTime+=delta;
    state.position=wrap01(state.position+delta);
    return state.position;
  }

  // Transport/sync semantics only. Physical platter interaction belongs to ControlSurfaceRenderer.
  MS.TurntableControl=Object.freeze({
    createState,beatSeconds,beatPhase,signedBeatDeltaSeconds,
    setRate,setBpm,setRole,setRunning,correctionWeight,
    requestSync,consumeSync,recover,tick
  });
})(window);
