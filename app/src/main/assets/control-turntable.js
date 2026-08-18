"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const TAU=Math.PI*2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const wrap01=v=>((v%1)+1)%1;

  function createState(opts={}){
    return {
      position:clamp(opts.position??0,0,1),
      rate:Number.isFinite(opts.rate)?opts.rate:1,
      running:opts.running!==false,
      grabbed:false,
      angle:0,
      turns:0,
      lastAngle:null,
      mode:opts.mode==="clamped"?"clamped":"cyclical",
      min:Number.isFinite(opts.min)?opts.min:0,
      max:Number.isFinite(opts.max)?opts.max:1
    };
  }

  function valueForPosition(state){return state.min+(state.max-state.min)*state.position}
  function normalizeAngle(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a}
  function angleFromPoint(cx,cy,x,y){return Math.atan2(y-cy,x-cx)}

  function grab(state,angle){state.grabbed=true;state.lastAngle=angle;return state}
  function drag(state,angle,sensitivity=1){
    if(state.lastAngle==null)state.lastAngle=angle;
    const delta=normalizeAngle(angle-state.lastAngle);
    state.lastAngle=angle;
    const turnDelta=(delta/TAU)*sensitivity;
    state.turns+=turnDelta;
    if(state.mode==="cyclical")state.position=wrap01(state.position+turnDelta);
    else state.position=clamp(state.position+turnDelta,0,1);
    state.angle+=delta;
    return {delta,turnDelta,position:state.position,value:valueForPosition(state)};
  }
  function release(state){state.grabbed=false;state.lastAngle=null;return state}
  function setRate(state,rate){state.rate=Number(rate)||0;return state.rate}
  function setRunning(state,running){state.running=!!running;return state.running}
  function tick(state,dtSeconds){
    if(!state.running||state.grabbed)return state.position;
    const delta=(Number(dtSeconds)||0)*state.rate;
    if(state.mode==="cyclical")state.position=wrap01(state.position+delta);
    else state.position=clamp(state.position+delta,0,1);
    state.angle+=delta*TAU;
    return state.position;
  }

  // Visual/control state only. Media binding decides whether position/rate target audio, video, or both.
  MS.TurntableControl=Object.freeze({createState,valueForPosition,angleFromPoint,grab,drag,release,setRate,setRunning,tick});
})(window);
