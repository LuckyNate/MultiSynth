"use strict";
(function(){
  const q=new URLSearchParams(location.search),instance=q.get("instance"),P=parent.MultiSynth||{},I=P.ModuleIds,E=P.RackEngine,A=P.RackAudioGraph,C=P.ModuleContract,B=P.ModuleBuilderDefinitions,R=window.MultiSynth?.ControlSurfaceRenderer;
  if(!I||!E||!B||!R)return;
  let rackId="",state={};
  if(instance)try{for(const r of E.graph().racks||[]){const m=r.modules?.find?.(x=>x.id===instance);if(m){rackId=r.id;state=m.state||{};break}}}catch(_){}
  const def=B.get(I.NO_QUARTER);if(!def)return;
  const root=document.getElementById("controls");if(!root)return;
  const panel=document.createElement("div");panel.className="nq-panel";
  const grid=document.createElement("div");grid.className="nq-controls";panel.appendChild(grid);
  const crackleBank=document.createElement("section");crackleBank.className="nq-crackle-bank";crackleBank.innerHTML='<div class="nq-crackle-head"><div class="nq-crackle-title">CRACKLE EVENTS</div><div class="nq-crackle-sub">MASTER VOLUME · EVENT DENSITY</div></div>';
  const crackleGrid=document.createElement("div");crackleGrid.className="nq-crackle-grid";crackleBank.appendChild(crackleGrid);panel.appendChild(crackleBank);root.appendChild(panel);
  const crackleIds=new Set(["crackle","crackleMicro","crackleTick","cracklePop","crackleDust","crackleArc"]);
  const patch=(key,value)=>{state={...state,[key]:value};if(rackId&&instance)try{E.setModuleState(rackId,instance,{[key]:value});A?.rebuild?.()}catch(e){console.error(e)}};
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const quant=(v,min,step)=>min+Math.round((v-min)/step)*step;
  const paint=(node,d,v)=>{const min=Number(d.value?.min??0),max=Number(d.value?.max??1),pct=(v-min)/(max-min||1),angle=-135+clamp(pct,0,1)*270;const p=node.querySelector(".ms-control-pointer");if(p)p.style.transform=`translateX(-50%) rotate(${angle}deg)`;const out=node.querySelector(".ms-control-value");if(out){const unit=d.meta?.unit||"";out.textContent=(Number.isInteger(Number(d.value?.step))?Math.round(v):Number(v).toFixed(2))+unit}};
  for(const d0 of def.controls){
    if(d0.control!=="knob"&&d0.control!=="dial")continue;
    const variant=d0.control==="dial"?"rotary":"cap";
    const d={...d0,meta:{...(d0.meta||{}),visual:{variant,size:86,valueReadout:true}}};
    let node;
    const target=crackleIds.has(d.id)?crackleGrid:grid;
    try{node=R.mount(target,d)}catch(e){console.error("NO QUARTER CONTROL RENDER",d.id,e);continue}
    if(crackleIds.has(d.id)){node.classList.add("nq-crackle-control");if(d.id==="crackle")node.classList.add("nq-crackle-master")}
    const key=d.state||d.id,min=Number(d.value?.min??0),max=Number(d.value?.max??1),step=Number(d.value?.step??.01);let value=Number(state[key]??d.value?.default??min);paint(node,d,value);let startY=0,startValue=value,active=false;
    node.addEventListener("pointerdown",e=>{active=true;startY=e.clientY;startValue=value;node.setPointerCapture?.(e.pointerId);node.dataset.active="1";e.preventDefault()});
    node.addEventListener("pointermove",e=>{if(!active)return;const span=max-min,raw=startValue+(startY-e.clientY)*(span/180);value=clamp(quant(raw,min,step),min,max);paint(node,d,value);patch(key,value);e.preventDefault()});
    const end=e=>{if(!active)return;active=false;node.dataset.active="0";try{node.releasePointerCapture?.(e.pointerId)}catch(_){}};node.addEventListener("pointerup",end);node.addEventListener("pointercancel",end);
  }
  function releaseNote(note){if(!instance||!C)return A?.noteOff?.(note);let rt;try{rt=C.getRuntime(instance)}catch(_){return A?.noteOff?.(note)}const u=rt?.user,v=u?.voices?.get?.(String(note));if(!u?.ctx||!v)return C.noteOff(instance,note);const now=u.ctx.currentTime,release=.24;for(const g of v.gains||[]){const p=g?.gain;if(!p)continue;try{p.cancelScheduledValues(now);p.setValueAtTime(Math.max(.0001,p.value),now);p.exponentialRampToValueAtTime(.0001,now+release)}catch(_){}}setTimeout(()=>{try{if(u.voices?.get?.(String(note))===v)C.noteOff(instance,note)}catch(_){}},Math.ceil((release+.03)*1000));return true}
  const nqAudio=instance&&C?{resume:()=>A?.resume?.(),noteOn:(n,v)=>{A?.resume?.();return C.noteOn(instance,n,v)},noteOff:releaseNote,panic:()=>C.panic(instance)}:A;
  const keyboardHost=document.getElementById("performanceKeyboard");if(keyboardHost&&window.MultiSynth?.PerformanceKeyboard?.mount)window.MultiSynth.PerformanceKeyboard.mount(keyboardHost,{audio:nqAudio});
})();