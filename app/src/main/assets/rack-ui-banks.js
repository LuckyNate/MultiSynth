"use strict";
(function(global){
  /*
   * Shared RackUI bank primitives.
   *
   * A bank is a faceplate layout primitive: one full-width container owns the
   * arrangement of repeated controls, while each control continues to own only
   * its own behavior and internal markup. This prevents nested knob/button/pad
   * internals from accidentally participating in the faceplate grid.
   *
   * Banks are presentation/layout only. They do not add DSP, routing, state,
   * persistence, or automation semantics beyond the controls they contain.
   */
  const U=global.RackUI;
  if(!U)return;

  const clampColumns=(n,count)=>Math.max(1,Math.min(Math.max(1,count||1),Number(n)||count||1));
  const autoColumns=count=>{
    count=Math.max(1,Number(count)||1);
    if(count<=4)return count;       // 4 knobs => one four-wide row.
    if(count===5)return 5;
    if(count===6)return 6;
    if(count<=8)return 4;
    if(count<=12)return 6;
    return 8;
  };

  function bank(sec,{label="",items=[],columns=null,className="",kind="control"}={}){
    const wrap=document.createElement("div");
    wrap.className=`rackControlBank rack${kind[0].toUpperCase()+kind.slice(1)}Bank ${className}`.trim();
    const count=Math.max(1,items.length||0),cols=clampColumns(columns||autoColumns(count),count);
    wrap.dataset.bankKind=kind;
    wrap.dataset.bankCount=String(items.length||0);
    wrap.dataset.bankColumns=String(cols);
    if(label){const h=document.createElement("div");h.className="rackControlBankLabel";h.textContent=label;wrap.appendChild(h)}
    const grid=document.createElement("div");
    grid.className="rackControlBankGrid";
    grid.style.display="grid";
    grid.style.gridTemplateColumns=`repeat(${cols},minmax(0,1fr))`;
    grid.style.gap="var(--rack-bank-gap,8px)";
    grid.style.alignItems="start";
    grid.style.width="100%";
    wrap.appendChild(grid);
    sec?.appendChild(wrap);
    return{wrap,grid,columns:cols,count:items.length||0};
  }

  function build(sec,opts,primitive,kind){
    const items=Array.isArray(opts?.items)?opts.items:[];
    const b=bank(sec,{...opts,items,kind});
    const controls=items.map(item=>primitive(b.grid,item||{}));
    return Object.freeze({wrap:b.wrap,grid:b.grid,controls:Object.freeze(controls),columns:b.columns,count:b.count});
  }

  function knobBank(sec,opts={}){return build(sec,opts,U.knob,"knob")}
  function dialBank(sec,opts={}){return build(sec,opts,U.dial,"dial")}
  function ribbonBank(sec,opts={}){return build(sec,opts,U.verticalRibbon,"ribbon")}
  function toggleBank(sec,opts={}){return build(sec,opts,U.toggle,"toggle")}

  function buttonBank(sec,{label="",items=[],columns=null,className="",onPress=null}={}){
    const b=bank(sec,{label,items,columns,className,kind:"button"}),controls=[];
    items.forEach((item,index)=>{
      const spec=typeof item==="string"?{label:item}:item||{},el=document.createElement("button");
      el.type="button";
      el.className=`rackBankButton ${spec.className||""}`.trim();
      el.textContent=String(spec.label??spec.text??index+1);
      if(spec.stateKey)el.dataset.stateKey=String(spec.stateKey);
      el.onclick=e=>{spec.onPress?.(e,el,index);onPress?.(index,spec,e,el)};
      b.grid.appendChild(el);controls.push(el);
    });
    return Object.freeze({wrap:b.wrap,grid:b.grid,controls:Object.freeze(controls),columns:b.columns,count:b.count});
  }

  function padBank(sec,{label="",items=[],columns=null,className="",onPress=null,onRelease=null}={}){
    const b=bank(sec,{label,items,columns,className,kind:"pad"}),controls=[];
    items.forEach((item,index)=>{
      const spec=typeof item==="string"?{label:item}:item||{},el=document.createElement("button");
      el.type="button";
      el.className=`rackBankPad ${spec.className||""}`.trim();
      el.textContent=String(spec.label??spec.text??index+1);
      if(spec.stateKey)el.dataset.stateKey=String(spec.stateKey);
      let held=false,pid=null;
      const down=e=>{e.preventDefault();if(held)return;held=true;pid=e.pointerId;el.classList.add("active");try{el.setPointerCapture(pid)}catch(_){}spec.onPress?.(e,el,index);onPress?.(index,spec,e,el)};
      const up=e=>{if(!held||(e?.pointerId!==undefined&&pid!==null&&e.pointerId!==pid))return;held=false;pid=null;el.classList.remove("active");spec.onRelease?.(e,el,index);onRelease?.(index,spec,e,el)};
      el.addEventListener("pointerdown",down);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("lostpointercapture",up);
      b.grid.appendChild(el);controls.push(el);
    });
    return Object.freeze({wrap:b.wrap,grid:b.grid,controls:Object.freeze(controls),columns:b.columns,count:b.count});
  }

  global.RackUIBanks=Object.freeze({bank,knobBank,dialBank,ribbonBank,toggleBank,buttonBank,padBank,autoColumns});
})(window);
