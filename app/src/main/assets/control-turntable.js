"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const REFERENCE_RPM=100/3;
  const SECONDS_PER_TURN=60/REFERENCE_RPM;
  const REFERENCE_ANGULAR_VELOCITY=Math.PI*2/SECONDS_PER_TURN;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const wrap01=v=>((v%1)+1)%1;
  const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
  const angleAt=(face,e)=>{const r=face.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height*.5),e.clientX-(r.left+r.width*.5))};
  const wrapDelta=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a};
  const workletBase=global.document?.currentScript?.src||global.location?.href||"";
  const WORKLET_URL=(()=>{try{return new URL("control-turntable-worklet.js",workletBase).href}catch(_){return"control-turntable-worklet.js"}})();
  const WORKLET_LOADS=new WeakMap();
  const ensureWorklet=ctx=>{let p=WORKLET_LOADS.get(ctx);if(!p){p=ctx.audioWorklet.addModule(WORKLET_URL);WORKLET_LOADS.set(ctx,p)}return p};

  function createState(opts={}){
    const position=Math.max(0,Number(opts.position)||0);
    return {position,trackTime:Number(opts.trackTime)||0,rate:Number.isFinite(opts.rate)?opts.rate:1,trueRate:Number.isFinite(opts.trueRate)?opts.trueRate:1,bpm:Number.isFinite(opts.bpm)?opts.bpm:120,running:opts.running!==false,role:opts.role==="follower"?"follower":"leader",correctionMin:Number.isFinite(opts.correctionMin)?opts.correctionMin:0.10,correctionFull:Number.isFinite(opts.correctionFull)?opts.correctionFull:0.15,correctionMax:Number.isFinite(opts.correctionMax)?opts.correctionMax:0.20,recoveryStrength:Number.isFinite(opts.recoveryStrength)?opts.recoveryStrength:10,syncRequested:false,referenceRPM:REFERENCE_RPM,secondsPerTurn:SECONDS_PER_TURN,active:false,angularVelocity:REFERENCE_ANGULAR_VELOCITY,platterRate:1,rpm:REFERENCE_RPM};
  }

  function beatSeconds(state){return 60/Math.max(1e-6,state.bpm)}
  function beatPhase(state){return wrap01(state.trackTime/beatSeconds(state))}
  function signedBeatDeltaSeconds(state,target){const b=beatSeconds(state),a=beatPhase(state),t=beatPhase(target);let d=(t-a)*b;if(d>b/2)d-=b;if(d<-b/2)d+=b;return d}
  function setRate(state,rate){state.rate=Number(rate)||0;return state.rate}
  function setBpm(state,bpm){state.bpm=Math.max(1e-6,Number(bpm)||120);return state.bpm}
  function setRole(state,role){state.role=role==="follower"?"follower":"leader";return state.role}
  function setRunning(state,running){state.running=!!running;return state.running}
  function correctionWeight(errorSeconds,state){const e=Math.abs(errorSeconds);if(e<=state.correctionMin||e>=state.correctionMax)return 0;if(e<=state.correctionFull)return(e-state.correctionMin)/(state.correctionFull-state.correctionMin);return(state.correctionMax-e)/(state.correctionMax-state.correctionFull)}
  function requestSync(state){state.syncRequested=true;return true}
  function consumeSync(state,leader){if(!state.syncRequested||!leader)return false;state.trackTime=leader.trackTime;state.position=leader.position;state.bpm=leader.bpm;state.rate=leader.rate;state.syncRequested=false;return true}
  function recover(state,target,dtSeconds){const dt=Math.max(0,Number(dtSeconds)||0),desiredRate=target?target.rate:state.trueRate;if(target&&state.role==="follower"){const err=signedBeatDeltaSeconds(state,target),w=correctionWeight(err,state),phaseNudge=w?err*Math.max(.25,state.recoveryStrength):0;state.rate=lerp(state.rate,desiredRate+phaseNudge,1-Math.exp(-state.recoveryStrength*dt))}else state.rate=lerp(state.rate,desiredRate,1-Math.exp(-state.recoveryStrength*dt));return state.rate}
  function tick(state,dtSeconds,target=null){if(!state.running)return state.position;const dt=Math.max(0,Number(dtSeconds)||0);if(state.syncRequested&&target)consumeSync(state,target);recover(state,target,dt);const delta=dt*state.rate;state.trackTime+=delta;state.position=wrap01(state.position+delta);return state.position}

  function bindTurntable(root,state=createState(),opts={}){
    if(!root||root.dataset?.control!=="turntable")throw new Error("TurntableControl.bindTurntable requires a turntable control");
    const face=root.querySelector(".ms-control-face");if(!face)return root;
    root.__msTurntableDestroy?.();
    const friction=Math.max(.1,Number(opts.friction)||Math.PI*2),emitEvery=Math.max(8,Number(opts.emitEveryMs)||16);
    let pointer=null,lastAngle=0,lastTime=0,lastFrame=0,lastEmit=0,frame=0,destroyed=false,rotation=Number(root.dataset.turntableRotation)||0;
    state.referenceRPM=REFERENCE_RPM;state.secondsPerTurn=SECONDS_PER_TURN;if(!Number.isFinite(state.angularVelocity))state.angularVelocity=REFERENCE_ANGULAR_VELOCITY;
    const paint=()=>{face.style.transform=`rotate(${rotation}deg)`;root.dataset.turntableRotation=String(rotation)};
    const payload=(event=null,deltaRadians=0)=>({position:state.position,rate:state.platterRate,rpm:state.rpm,direction:Math.sign(state.platterRate),active:state.active,angularVelocity:state.angularVelocity,deltaRadians,deltaDegrees:deltaRadians*180/Math.PI,rotationDegrees:rotation,turns:rotation/360,referenceRPM:REFERENCE_RPM,secondsPerTurn:SECONDS_PER_TURN,controlId:root.dataset.controlId||null,stateKey:root.dataset.stateKey||null,event});
    const emit=(name,event=null,delta=0)=>{const p=payload(event,delta);root.dispatchEvent(new CustomEvent(`multisynth-control-turntable-${name}`,{bubbles:true,detail:p}));return p};
    const updateDerived=()=>{state.platterRate=state.angularVelocity/REFERENCE_ANGULAR_VELOCITY;state.rpm=state.platterRate*REFERENCE_RPM};
    root.setTurntablePosition=value=>{state.position=Math.max(0,Number(value)||0);return root};root.getTurntableMotion=()=>payload();face.style.touchAction="none";
    const down=e=>{if(e.button!=null&&e.button!==0)return;pointer=e.pointerId;state.active=true;state.angularVelocity=0;updateDerived();lastAngle=angleAt(face,e);lastTime=performance.now();root.dataset.turntableActive="1";try{face.setPointerCapture?.(pointer)}catch(_){}emit("motion",e,0);emit("press",e,0);e.preventDefault()};
    const move=e=>{if(!state.active||e.pointerId!==pointer)return;const now=performance.now(),a=angleAt(face,e),delta=wrapDelta(a-lastAngle),dt=Math.max(.001,(now-lastTime)/1000);state.angularVelocity=delta/dt;updateDerived();state.position=Math.max(0,state.position+state.platterRate*dt);rotation+=delta*180/Math.PI;lastAngle=a;lastTime=now;paint();emit("motion",e,delta);emit("drag",e,delta);e.preventDefault()};
    const end=(e,cancelled=false)=>{if(pointer!=null&&e?.pointerId!=null&&e.pointerId!==pointer)return;const wasActive=state.active;state.active=false;root.dataset.turntableActive="0";try{if(pointer!=null)face.releasePointerCapture?.(pointer)}catch(_){}pointer=null;if(wasActive)emit("release",e,0);if(cancelled)emit("cancel",e,0)};
    face.addEventListener("pointerdown",down);face.addEventListener("pointermove",move);face.addEventListener("pointerup",end);face.addEventListener("pointercancel",e=>end(e,true));face.addEventListener("lostpointercapture",e=>{if(e.pointerId===pointer)end(e,true)});
    const animate=now=>{if(destroyed)return;if(!lastFrame)lastFrame=now;const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;if(!state.active){const diff=REFERENCE_ANGULAR_VELOCITY-state.angularVelocity,step=friction*dt;state.angularVelocity=Math.abs(diff)<=step?REFERENCE_ANGULAR_VELOCITY:state.angularVelocity+Math.sign(diff)*step;updateDerived();state.position=Math.max(0,state.position+state.platterRate*dt);rotation+=state.angularVelocity*180/Math.PI*dt;paint();if(now-lastEmit>=emitEvery){lastEmit=now;emit("motion")}}frame=requestAnimationFrame(animate)};
    frame=requestAnimationFrame(animate);paint();root.__msTurntableBinding=state;root.__msTurntableDestroy=()=>{destroyed=true;if(frame)cancelAnimationFrame(frame);try{if(pointer!=null)face.releasePointerCapture?.(pointer)}catch(_){}face.removeEventListener("pointerdown",down);face.removeEventListener("pointermove",move);face.removeEventListener("pointerup",end);pointer=null;state.active=false;root.dataset.turntableActive="0"};return root;
  }

  function createPlatterEngine(ctx,output,opts={}){
    const WorkletNode=global.AudioWorkletNode;
    if(!ctx||!output||!ctx.audioWorklet||typeof WorkletNode!=="function")return null;
    let node=null,buffer=null,active=false,playhead=0,rate=1,loop=!!opts.loop,ended=false,destroyed=false,pendingStart=null;
    const onEnd=typeof opts.onEnd==="function"?opts.onEnd:null;
    const setParam=value=>{rate=Number(value)||0;if(!node)return;const p=node.parameters.get("rate");if(!p)return;try{p.cancelScheduledValues(ctx.currentTime);p.setValueAtTime(rate,ctx.currentTime)}catch(_){p.value=rate}};
    const send=(type,extra={})=>{if(node)node.port.postMessage({type,...extra})};
    const sendBuffer=()=>{if(!node||!buffer)return;const channels=[],transfer=[];for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c).slice();channels.push(data);transfer.push(data.buffer)}node.port.postMessage({type:"buffer",channels,sampleRate:buffer.sampleRate},transfer)};
    const startNow=(position,nextRate)=>{playhead=Math.max(0,Math.min(buffer.duration,Number(position)||0));active=true;ended=false;send("start",{position:playhead});setParam(nextRate)};
    const ready=ensureWorklet(ctx).then(()=>{
      if(destroyed)return null;
      node=new WorkletNode(ctx,"multisynth-platter",{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],parameterData:{rate}});
      node.port.onmessage=e=>{const d=e.data||{};if(d.type==="state"){playhead=Math.max(0,Number(d.position)||0);active=!!d.active;ended=!!d.ended}else if(d.type==="ended"){playhead=Math.max(0,Number(d.position)||0);active=false;ended=true;rate=0;onEnd?.({position:playhead})}};
      node.connect(output);send("loop",{value:loop});sendBuffer();
      if(pendingStart){const p=pendingStart;pendingStart=null;startNow(p.position,p.rate)}else setParam(rate);
      return node;
    }).catch(e=>{console.error("MultiSynth platter AudioWorklet failed",e);active=false;ended=true;return null});
    return{
      setBuffer(next){buffer=next||null;if(buffer)playhead=Math.max(0,Math.min(buffer.duration,playhead));sendBuffer();return this},
      setLoop(next){loop=!!next;send("loop",{value:loop});return loop},
      start(position=0,nextRate=1){if(!buffer)return false;const p=Math.max(0,Math.min(buffer.duration,Number(position)||0));if(node)startNow(p,nextRate);else{playhead=p;active=true;ended=false;rate=Number(nextRate)||0;pendingStart={position:p,rate}}return true},
      setRate(nextRate=0){if(!buffer||!active)return false;setParam(nextRate);return true},
      setMotion(position=0,nextRate=0){return this.setRate(nextRate)},
      seek(position=0){if(buffer)playhead=Math.max(0,Math.min(buffer.duration,Number(position)||0));send("seek",{position:playhead});return true},
      stop(position=null){if(position!=null&&buffer)playhead=Math.max(0,Math.min(buffer.duration,Number(position)||0));active=false;ended=false;pendingStart=null;setParam(0);send("stop",{position:position!=null?playhead:null});return true},
      disconnect(){destroyed=true;active=false;pendingStart=null;try{node?.port?.close?.()}catch(_){}try{node?.disconnect?.()}catch(_){}node=null},
      get position(){return playhead},get rate(){return rate},get active(){return active},get loop(){return loop},get ended(){return ended},get ready(){return ready}
    };
  }

  MS.TurntableControl=Object.freeze({REFERENCE_RPM,SECONDS_PER_TURN,REFERENCE_ANGULAR_VELOCITY,createState,beatSeconds,beatPhase,signedBeatDeltaSeconds,setRate,setBpm,setRole,setRunning,correctionWeight,requestSync,consumeSync,recover,tick,bindTurntable,createPlatterEngine,createScratchEngine:createPlatterEngine});
})(window);
