"use strict";
(function(){
  const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},I=P.ModuleIds,E=P.RackEngine,A=P.RackAudioGraph,B=P.ModuleBuilderDefinitions,R=window.MultiSynth?.ControlSurfaceRenderer;
  if(!I||!E||!B||!R)return;
  let rackId="",state={};
  if(instance)try{for(const r of E.graph().racks||[]){const m=r.modules?.find?.(x=>x.id===instance);if(m){rackId=r.id;state=m.state||{};break}}}catch(_){}
  const def=B.get(I.NO_QUARTER);if(!def)return;
  const root=document.getElementById("controls");if(!root)return;
  const panel=document.createElement("div");panel.className="nq-panel";
  const grid=document.createElement("div");grid.className="nq-controls";panel.appendChild(grid);root.appendChild(panel);
  const patch=(key,value)=>{state={...state,[key]:value};if(rackId&&instance)try{E.setModuleState(rackId,instance,{[key]:value});A?.rebuild?.()}catch(e){console.error(e)}};
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const quant=(v,min,step)=>min+Math.round((v-min)/step)*step;
  const paint=(node,d,v)=>{const min=Number(d.value?.min??0),max=Number(d.value?.max??1),pct=(v-min)/(max-min||1),angle=-135+clamp(pct,0,1)*270;const p=node.querySelector(".ms-control-pointer");if(p)p.style.transform=`translateX(-50%) rotate(${angle}deg)`;const out=node.querySelector(".ms-control-value");if(out){const unit=d.meta?.unit||"";out.textContent=(Number.isInteger(Number(d.value?.step))?Math.round(v):Number(v).toFixed(2))+unit}};
  for(const d0 of def.controls){if(d0.control!=="knob"&&d0.control!=="dial")continue;const d={...d0,meta:{...(d0.meta||{}),visual:{variant:"large",size:86,valueReadout:true}}};const node=R.mount(grid,d);const key=d.state||d.id,min=Number(d.value?.min??0),max=Number(d.value?.max??1),step=Number(d.value?.step??.01);let value=Number(state[key]??d.value?.default??min);paint(node,d,value);let startY=0,startValue=value,active=false;
    node.addEventListener("pointerdown",e=>{active=true;startY=e.clientY;startValue=value;node.setPointerCapture?.(e.pointerId);node.dataset.active="1";e.preventDefault()});
    node.addEventListener("pointermove",e=>{if(!active)return;const span=max-min,raw=startValue+(startY-e.clientY)*(span/180);value=clamp(quant(raw,min,step),min,max);paint(node,d,value);patch(key,value);e.preventDefault()});
    const end=e=>{if(!active)return;active=false;node.dataset.active="0";try{node.releasePointerCapture?.(e.pointerId)}catch(_){}};node.addEventListener("pointerup",end);node.addEventListener("pointercancel",end);
  }
  const keyboardHost=document.getElementById("performanceKeyboard");if(keyboardHost&&window.MultiSynth?.PerformanceKeyboard?.mount)window.MultiSynth.PerformanceKeyboard.mount(keyboardHost,{audio:A});
})();