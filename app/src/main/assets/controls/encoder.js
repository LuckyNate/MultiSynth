"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};
  // CANON CONTROL — ENCODER — DO NOT EDIT EXISTING VISUALS WITHOUT EXPLICIT NO-TOUCH OVERRIDE.
  R.encoder=Object.freeze({
    type:Object.freeze({variant:"rotary",size:128,touch:140,travel:300,startAngle:-150,endAngle:150,ticks:12,pointer:"dot",labelGap:8,valueReadout:false}),
    variants:Object.freeze(["rotary","selector","indexed"])
  });

  const states=new WeakMap(),MOVE_THRESHOLD=6;
  const wrapDelta=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a};
  const angleAt=(face,e)=>{const r=face.getBoundingClientRect(),cx=r.left+r.width*.5,cy=r.top+r.height*.5;return Math.atan2(e.clientY-cy,e.clientX-cx)+Math.PI/2};
  const cssRotation=root=>{const raw=String(root.style.getPropertyValue("--ms-angle")||getComputedStyle(root).getPropertyValue("--ms-angle")||"0"),n=Number.parseFloat(raw);return Number.isFinite(n)?n*Math.PI/180:0};
  function emit(root,d,state,active,delta,event){
    root.dispatchEvent(new CustomEvent("multisynth-control-circular-drag",{bubbles:true,detail:{
      active,
      deltaRadians:delta,
      deltaDegrees:delta*180/Math.PI,
      rotationRadians:state.rotation,
      rotationDegrees:state.rotation*180/Math.PI,
      turns:state.rotation/(Math.PI*2),
      fingerAngleRadians:state.lastFingerAngle,
      direction:Math.sign(delta),
      clockwise:delta>0,
      controlId:d?.id??root.dataset.controlId??null,
      stateKey:d?.state??root.dataset.stateKey??null,
      event
    }}));
  }
  function install(root){
    if(!root||root.dataset.control!=="encoder"||root.__msCanonicalEncoderInstalled)return;
    root.__msCanonicalEncoderInstalled=true;
    const face=root.querySelector(".ms-control-face");if(!face)return;
    face.style.touchAction="none";
    const state={pointer:null,startX:0,startY:0,lastFingerAngle:0,rotation:cssRotation(root),active:false};
    states.set(root,state);
    root.addEventListener("pointerdown",e=>{
      if(e.button!=null&&e.button!==0)return;
      state.pointer=e.pointerId;
      state.startX=e.clientX;
      state.startY=e.clientY;
      state.lastFingerAngle=angleAt(face,e);
      state.rotation=cssRotation(root);
      state.active=false;
    },true);
    root.addEventListener("pointermove",e=>{
      if(e.pointerId!==state.pointer)return;
      const moved=Math.hypot(e.clientX-state.startX,e.clientY-state.startY);
      if(!state.active&&moved<=MOVE_THRESHOLD)return;
      const finger=angleAt(face,e),delta=wrapDelta(finger-state.lastFingerAngle);
      state.active=true;
      state.lastFingerAngle=finger;
      state.rotation+=delta;
      root.style.setProperty("--ms-angle",`${state.rotation*180/Math.PI}deg`);
      emit(root,root.__msDescriptor,state,true,delta,e);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    const end=e=>{
      if(e.pointerId!==state.pointer)return;
      const wasActive=state.active;
      state.pointer=null;
      state.active=false;
      if(wasActive)emit(root,root.__msDescriptor,state,false,0,e);
    };
    root.addEventListener("pointerup",end,true);
    root.addEventListener("pointercancel",end,true);
  }
  function scan(node){
    if(!node||node.nodeType!==1)return;
    if(node.matches?.(".ms-encoder"))install(node);
    node.querySelectorAll?.(".ms-encoder").forEach(install);
  }
  scan(global.document?.documentElement);
  if(global.MutationObserver&&global.document?.documentElement)new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(scan))).observe(global.document.documentElement,{childList:true,subtree:true});
})(window);
