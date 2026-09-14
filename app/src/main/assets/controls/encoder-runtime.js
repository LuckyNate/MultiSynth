"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},POINTER=new Set(["pointerdown","pointermove","pointerup","pointercancel"]),THRESHOLD=6;
  const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a};
  const angle=(face,e)=>{const r=face.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))+Math.PI/2};
  const invoke=(fn,root,e)=>typeof fn==="function"?fn.call(root,e):fn?.handleEvent?.call(fn,e);
  function install(root){
    if(!root||root.dataset.control!=="encoder"||root.__msEncoderRuntime)return root;
    const face=root.querySelector(".ms-control-face");if(!face)return root;
    root.__msEncoderRuntime=true;face.style.touchAction="none";
    const add=root.addEventListener.bind(root),remove=typeof root.removeEventListener==="function"?root.removeEventListener.bind(root):()=>{},later={pointerdown:[],pointermove:[],pointerup:[],pointercancel:[]};
    const s={pointer:null,x:0,y:0,last:0,rotation:0,turns:0,active:false};
    const emit=(active,delta,e)=>root.dispatchEvent(new CustomEvent("multisynth-control-circular-drag",{bubbles:true,detail:{active,deltaRadians:delta,deltaDegrees:delta*180/Math.PI,rotationRadians:s.rotation,rotationDegrees:s.rotation*180/Math.PI,turns:s.rotation/(Math.PI*2),direction:Math.sign(delta),clockwise:delta>0,controlId:root.dataset.controlId||null,stateKey:root.dataset.stateKey||null,event:e}}));
    const routedY=()=>{const d=root.__msDescriptor,min=Number(d?.value?.min),max=Number(d?.value?.max),step=Number(d?.value?.step),span=Number.isFinite(min)&&Number.isFinite(max)?Math.abs(max-min):1,indexed=root.dataset.variant==="indexed"||root.dataset.variant==="selector",pixels=indexed&&step>0?Math.max(28,28*span/step):180;return s.y-s.turns*pixels};
    add("pointerdown",e=>{if(e.button!=null&&e.button!==0)return;s.pointer=e.pointerId;s.x=e.clientX;s.y=e.clientY;s.last=angle(face,e);s.turns=0;s.active=false;const deg=Number.parseFloat(root.style.getPropertyValue("--ms-angle"));s.rotation=(Number.isFinite(deg)?deg:0)*Math.PI/180;later.pointerdown.slice().forEach(fn=>invoke(fn,root,e))},true);
    add("pointermove",e=>{if(e.pointerId!==s.pointer)return;if(!s.active&&Math.hypot(e.clientX-s.x,e.clientY-s.y)<=THRESHOLD)return;const a=angle(face,e),delta=wrap(a-s.last);s.last=a;s.active=true;s.rotation+=delta;s.turns+=delta/(Math.PI*2);root.style.setProperty("--ms-angle",`${s.rotation*180/Math.PI}deg`);emit(true,delta,e);const routed={pointerId:e.pointerId,button:e.button,clientX:e.clientX,clientY:routedY(),preventDefault:()=>e.preventDefault(),stopPropagation:()=>{},stopImmediatePropagation:()=>{}};later.pointermove.slice().forEach(fn=>invoke(fn,root,routed));e.preventDefault();e.stopImmediatePropagation()},true);
    const end=(e,cancel=false)=>{if(e.pointerId!==s.pointer)return;(cancel?later.pointercancel:later.pointerup).slice().forEach(fn=>invoke(fn,root,e));const active=s.active;s.pointer=null;s.active=false;s.turns=0;if(active)emit(false,0,e)};
    add("pointerup",e=>end(e),true);add("pointercancel",e=>end(e,true),true);
    root.addEventListener=(type,fn,options)=>{const capture=options===true||!!options?.capture;if(POINTER.has(type)&&!capture){later[type].push(fn);return}return add(type,fn,options)};
    root.removeEventListener=(type,fn,options)=>{const capture=options===true||!!options?.capture;if(POINTER.has(type)&&!capture){const a=later[type],i=a.indexOf(fn);if(i>=0)a.splice(i,1);return}return remove(type,fn,options)};
    return root;
  }
  function wrap(renderer){if(!renderer||renderer.__msEncoderRuntimeWrapped)return renderer;const api={...renderer};api.render=(spec,options={})=>install(renderer.render(spec,options));api.mount=(parent,spec,options={})=>{const node=install(renderer.render(spec,options));parent.appendChild(node);return node};Object.defineProperty(api,"__msEncoderRuntimeWrapped",{value:true});return Object.freeze(api)}
  let renderer=wrap(MS.ControlSurfaceRenderer);const d=Object.getOwnPropertyDescriptor(MS,"ControlSurfaceRenderer");if(!d||d.configurable)Object.defineProperty(MS,"ControlSurfaceRenderer",{configurable:true,enumerable:true,get:()=>renderer,set:value=>{renderer=wrap(value)}});
})(window);
