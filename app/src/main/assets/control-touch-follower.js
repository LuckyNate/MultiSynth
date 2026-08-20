"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const DEFAULT_OFFSET_CM=1;
  let follower=null,owner=null;

  function ensure(){
    if(follower)return follower;
    follower=document.createElement("output");
    follower.className="ms-touch-follower";
    follower.setAttribute("aria-hidden","true");
    document.body.appendChild(follower);
    return follower;
  }
  function format(value,opts={}){
    if(opts.formatter)return String(opts.formatter(value));
    const precision=Number.isInteger(opts.precision)?opts.precision:null;
    let text=typeof value==="number"&&precision!=null?value.toFixed(precision):String(value??"");
    if(opts.unit)text+=String(opts.unit);
    return text;
  }
  function labelFor(control,opts={}){
    return String(opts.label||control?.dataset?.controlLabel||control?.getAttribute?.("aria-label")||control?.closest?.(".ms-control")?.querySelector?.(".ms-control-label")?.textContent||control?.dataset?.controlId||"").trim();
  }
  function position(x,y,offsetCm=DEFAULT_OFFSET_CM){
    const node=ensure();
    node.style.left=`${x}px`;
    node.style.top=`calc(${y}px - ${offsetCm}cm)`;
  }
  function show(control,value,point,opts={}){
    owner=control||owner;
    const node=ensure(),label=labelFor(control,opts),valueText=format(value,opts);
    node.replaceChildren();
    if(label){const name=document.createElement("strong");name.className="ms-touch-follower-label";name.textContent=label;node.appendChild(name)}
    const val=document.createElement("span");val.className="ms-touch-follower-value";val.textContent=valueText;node.appendChild(val);
    position(point.clientX,point.clientY,opts.offsetCm??DEFAULT_OFFSET_CM);
    node.classList.add("is-visible");
    return node;
  }
  function move(control,value,point,opts={}){
    if(owner&&control&&owner!==control)return null;
    return show(control,value,point,opts);
  }
  function hide(control){
    if(control&&owner&&control!==owner)return;
    if(follower)follower.classList.remove("is-visible");
    owner=null;
  }
  function bind(control,getValue,opts={}){
    if(!control)return()=>{};
    const read=()=>typeof getValue==="function"?getValue():getValue;
    const down=e=>show(control,read(),e,opts);
    const moveEvent=e=>{if(owner===control)move(control,read(),e,opts)};
    const up=()=>hide(control);
    control.addEventListener("pointerdown",down);
    control.addEventListener("pointermove",moveEvent);
    control.addEventListener("pointerup",up);
    control.addEventListener("pointercancel",up);
    control.addEventListener("lostpointercapture",up);
    return()=>{control.removeEventListener("pointerdown",down);control.removeEventListener("pointermove",moveEvent);control.removeEventListener("pointerup",up);control.removeEventListener("pointercancel",up);control.removeEventListener("lostpointercapture",up);hide(control)};
  }
  MS.ControlTouchFollower=Object.freeze({DEFAULT_OFFSET_CM,format,labelFor,show,move,hide,bind});
})(window);
