"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},R=MS.ControlSurfaceSpecParts=MS.ControlSurfaceSpecParts||{};

  R.screen=Object.freeze({
    type:Object.freeze({variant:"screen",width:240,height:120,touchWidth:240,touchHeight:120,corner:10,labelGap:8,valueReadout:false}),
    variants:Object.freeze(["screen","scroll"])
  });

  function makeUpdating(root){
    const overlay=document.createElement("div");
    overlay.className="ms-screen-updating";
    overlay.textContent="UPDATING";
    overlay.hidden=true;
    overlay.setAttribute("role","status");
    overlay.setAttribute("aria-live","polite");
    root.appendChild(overlay);
    let manual=false,latestRun=0;
    const apply=next=>{
      root.dataset.updating=next?"1":"0";
      root.setAttribute("aria-busy",next?"true":"false");
      overlay.hidden=!next;
      if(next)root.__msResetScreenTouch?.();
      return next;
    };
    root.setUpdating=value=>{manual=!!value;latestRun++;return apply(manual)};
    root.runUpdating=async work=>{
      const run=++latestRun;
      apply(true);
      try{return await(typeof work==="function"?work():work)}
      finally{if(run===latestRun&&!manual)apply(false)}
    };
    apply(false);
  }

  function installScroll(root,face){
    const THRESHOLD=8;
    const state={pointer:null,startY:0,startScroll:0,lastY:0,lastTime:0,velocity:0,dragging:false,target:null,frame:0,replaying:false};
    const sync=()=>{if(root.__msScreenBinding)root.__msScreenBinding.scrollTop=face.scrollTop};
    const stopMomentum=()=>{if(state.frame)cancelAnimationFrame(state.frame);state.frame=0;state.velocity=0};
    const clearTouch=()=>{
      if(state.pointer!=null){try{face.releasePointerCapture?.(state.pointer)}catch(_){}}
      state.pointer=null;state.startY=0;state.startScroll=face.scrollTop;state.lastY=0;state.lastTime=0;state.velocity=0;state.dragging=false;state.target=null;
      root.dataset.screenDragging="0";
    };
    const reset=()=>{stopMomentum();clearTouch()};
    const coast=()=>{
      if(Math.abs(state.velocity)<.02)return;
      let last=performance.now();
      const step=now=>{
        const dt=Math.min(32,Math.max(1,now-last));last=now;
        const before=face.scrollTop;
        face.scrollTop+=state.velocity*dt;
        state.velocity*=Math.pow(.92,dt/16.67);
        if(Math.abs(state.velocity)<.02||face.scrollTop===before){state.frame=0;state.velocity=0;sync();return}
        state.frame=requestAnimationFrame(step);
      };
      state.frame=requestAnimationFrame(step);
    };
    const replayTap=target=>{
      const control=target?.closest?.(".ms-library-choice,.ms-button");
      if(!control||!face.contains(control))return;
      state.replaying=true;
      try{control.click()}finally{state.replaying=false}
    };

    face.classList.add("ms-screen-scroll-face");
    root.__msResetScreenTouch=reset;
    face.addEventListener("scroll",sync,{passive:true});
    face.addEventListener("click",e=>{if(!state.replaying)e.stopImmediatePropagation()},true);
    face.addEventListener("pointerdown",e=>{
      if(e.button!=null&&e.button!==0)return;
      stopMomentum();
      state.pointer=e.pointerId;state.startY=e.clientY;state.startScroll=face.scrollTop;state.lastY=e.clientY;state.lastTime=performance.now();state.velocity=0;state.dragging=false;state.target=e.target;
      root.dataset.screenDragging="0";
      face.setPointerCapture?.(state.pointer);
      e.preventDefault();e.stopPropagation();
    },true);
    face.addEventListener("pointermove",e=>{
      if(e.pointerId!==state.pointer)return;
      const now=performance.now(),dy=e.clientY-state.startY;
      if(!state.dragging&&Math.abs(dy)>THRESHOLD){state.dragging=true;root.dataset.screenDragging="1"}
      if(state.dragging){
        const dt=Math.max(1,now-state.lastTime),instant=(state.lastY-e.clientY)/dt;
        state.velocity=state.velocity*.55+instant*.45;
        face.scrollTop=state.startScroll-dy;
      }
      state.lastY=e.clientY;state.lastTime=now;
      e.preventDefault();e.stopPropagation();
    },true);
    const end=(e,cancelled=false)=>{
      if(e.pointerId!==state.pointer)return;
      const dragged=state.dragging,target=state.target,velocity=state.velocity;
      clearTouch();
      if(dragged&&!cancelled){state.velocity=velocity;coast()}
      else if(!cancelled)replayTap(target);
      e.preventDefault();e.stopPropagation();
    };
    face.addEventListener("pointerup",e=>end(e),true);
    face.addEventListener("pointercancel",e=>end(e,true),true);
    face.addEventListener("lostpointercapture",e=>{if(e.pointerId===state.pointer)clearTouch()},true);
    requestAnimationFrame(sync);
  }

  function installPlain(root,face,d){
    const MOVE=8,HOLD=450,SWIPE=28,SWIPE_MS=600,state={pointer:null,startX:0,startY:0,startTime:0,moved:false,held:false,timer:0};
    const clearTimer=()=>{if(state.timer)clearTimeout(state.timer);state.timer=0};
    const point=e=>{const r=face.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/(r.width||1))),y:Math.max(0,Math.min(1,(e.clientY-r.top)/(r.height||1))),clientX:e.clientX,clientY:e.clientY}};
    const emit=(phase,e,extra={})=>root.dispatchEvent(new CustomEvent(`multisynth-control-screen-${phase}`,{bubbles:true,detail:{...point(e),...extra,controlId:d.id,stateKey:d.state,event:e}}));
    const reset=()=>{clearTimer();if(state.pointer!=null){try{face.releasePointerCapture?.(state.pointer)}catch(_){}}state.pointer=null;state.moved=false;state.held=false};
    root.__msResetScreenTouch=reset;
    face.addEventListener("pointerdown",e=>{if(e.button!=null&&e.button!==0)return;reset();state.pointer=e.pointerId;state.startX=e.clientX;state.startY=e.clientY;state.startTime=performance.now();face.setPointerCapture?.(state.pointer);state.timer=setTimeout(()=>{if(state.pointer===e.pointerId&&!state.moved){state.held=true;emit("hold",e)}},HOLD);e.preventDefault()});
    face.addEventListener("pointermove",e=>{if(e.pointerId!==state.pointer)return;const dx=e.clientX-state.startX,dy=e.clientY-state.startY;if(!state.moved&&Math.hypot(dx,dy)>MOVE){state.moved=true;clearTimer()}if(state.moved){const r=face.getBoundingClientRect();emit("drag",e,{deltaX:dx,deltaY:dy,dx:dx/(r.width||1),dy:dy/(r.height||1)});e.preventDefault()}});
    const end=(e,cancelled=false)=>{if(e.pointerId!==state.pointer)return;clearTimer();const dx=e.clientX-state.startX,dy=e.clientY-state.startY,duration=Math.max(0,performance.now()-state.startTime),distance=Math.hypot(dx,dy),moved=state.moved,held=state.held;try{face.releasePointerCapture?.(state.pointer)}catch(_){}state.pointer=null;state.moved=false;state.held=false;if(cancelled)return;if(!moved&&!held){emit("tap",e,{duration});return}if(moved&&distance>=SWIPE&&duration<=SWIPE_MS){const direction=Math.abs(dx)>=Math.abs(dy)?(dx<0?"left":"right"):(dy<0?"up":"down"),r=face.getBoundingClientRect();emit("swipe",e,{direction,duration,deltaX:dx,deltaY:dy,dx:dx/(r.width||1),dy:dy/(r.height||1)})}};
    face.addEventListener("pointerup",e=>end(e));face.addEventListener("pointercancel",e=>end(e,true));face.addEventListener("lostpointercapture",e=>{if(e.pointerId===state.pointer)reset()});
  }

  function install(root,face,d){
    const glass=document.createElement("span");glass.className="ms-screen-glass";face.appendChild(glass);
    if(root.dataset.variant==="scroll")installScroll(root,face);else installPlain(root,face,d);
    makeUpdating(root);
    return root;
  }

  function bind(root,state){
    if(!state||typeof state!=="object")throw new Error("screen binding requires a state object");
    root.__msResetScreenTouch?.();root.__msScreenBinding=state;
    if(root.dataset.variant==="scroll"&&state.scrollTop!==undefined){const face=root.querySelector?.(".ms-control-face"),top=Number(state.scrollTop);if(face&&Number.isFinite(top))face.scrollTop=Math.max(0,top)}
    if(state.updating!==undefined)root.setUpdating?.(!!state.updating);
    return root;
  }

  MS.ScreenControl=Object.freeze({install,bind});
})(window);
