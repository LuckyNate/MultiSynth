"use strict";
(function(){
  const q=new URLSearchParams(location.search),instance=q.get("instance");
  const P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph;
  const MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,CS=MS.ControlSurface;
  const root=document.getElementById("controls");
  if(!root||!R||!CS)return;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const copy=v=>JSON.parse(JSON.stringify(v));
  const makeContext=(left,right,knobs)=>({left,right,knobs:[...knobs],knobLocks:Array(4).fill(false)});
  const seed={
    context:"CLIP",
    contexts:{
      CLIP:makeContext(0,1,[.8,0,1,1]),
      STANZA:makeContext(0,1,[1,.25,1,0]),
      SONG:makeContext(0,1,[1,0,1,1]),
      LIVE:makeContext(0,1,[1,0,1,0])
    }
  };

  let state=copy(seed);
  if(instance){
    try{
      const saved=E?.getModule?.(instance)?.state;
      if(saved?.contexts)state={...state,...saved,contexts:{...state.contexts,...saved.contexts}};
    }catch(_){}
  }

  const persist=()=>{
    if(!instance)return;
    try{E?.setModuleState?.(instance,{context:state.context,contexts:copy(state.contexts)})}catch(e){console.error("Rearranger state",e)}
  };

  root.innerHTML="";
  root.classList.add("ms-module-surface");

  const makeGrid=role=>{
    const bank=document.createElement("section");
    bank.className="ms-module-bank";
    const grid=document.createElement("div");
    grid.className="ms-control-grid "+role;
    bank.appendChild(grid);
    root.appendChild(bank);
    return grid;
  };

  const readoutGrid=makeGrid("ms-layout-list");
  const readoutHost=document.createElement("div");
  readoutGrid.appendChild(readoutHost);
  const readout=CS.mountReadout(readoutHost,{id:"rearranger-readout",rows:8,columns:24,text:"REARRANGER  CLIP",lit:false});
  const styleRearrangerReadout=api=>{
    api.root.style.setProperty("--ms-readout-screen","#d88a18");
    api.root.style.setProperty("--ms-readout-border","#5a3513");
    api.root.style.setProperty("--ms-readout-on","#241507");
    api.root.style.setProperty("--ms-readout-off","rgba(58,35,10,.22)");
    api.root.style.setProperty("--ms-readout-glow","none");
    return api;
  };
  styleRearrangerReadout(readout);
  readout.root.querySelectorAll(".ms-14seg-segment").forEach(segment=>segment.style.strokeWidth="10");
  const readoutObserver=new MutationObserver(()=>readout.root.querySelectorAll(".ms-14seg-segment").forEach(segment=>segment.style.strokeWidth="10"));
  readoutObserver.observe(readout.root,{childList:true});

  const encoderGrid=makeGrid("ms-layout-pair");
  const encLeft=R.mount(encoderGrid,{id:"rearranger-left",control:"encoder",label:"LEFT",value:{default:0,min:0,max:1,step:.001}});
  const encRight=R.mount(encoderGrid,{id:"rearranger-right",control:"encoder",label:"RIGHT",value:{default:1,min:0,max:1,step:.001}});

  const knobGrid=makeGrid("ms-layout-context");
  const knobs=[0,1,2,3].map(i=>R.mount(knobGrid,{
    id:"rearranger-knob-"+(i+1),
    control:"knob",
    label:"PARAM "+(i+1),
    value:{default:.5,min:0,max:1,step:.001}
  }));

  const modeGrid=makeGrid("ms-layout-context");
  const modes=["CLIP","STANZA","SONG","LIVE"];
  const modeButtons=modes.map(name=>R.mount(modeGrid,{
    id:"rearranger-mode-"+name.toLowerCase(),
    control:"button",
    label:name
  }));

  const actionGrid=makeGrid("ms-layout-context");
  const actionNames=["PREV","NEXT","QUEUE","CLEAR"];
  const actionButtons=actionNames.map(name=>R.mount(actionGrid,{
    id:"rearranger-action-"+name.toLowerCase(),
    control:"button",
    label:name
  }));

  const transportGrid=makeGrid("ms-layout-context");
  const transportNames=["BACK","PLAY","STOP","FWD"];
  const transportButtons=transportNames.map(name=>R.mount(transportGrid,{
    id:"rearranger-transport-"+name.toLowerCase(),
    control:"button",
    label:name
  }));

  const timingGrid=makeGrid("ms-layout-timing");
  const timingSize=84;
  const timingPad=R.mount(timingGrid,{id:"rearranger-tap-tempo",control:"pad",label:"TAP"},{
    visual:{width:timingSize,height:timingSize,touchWidth:92,touchHeight:92}
  });

  const tempoIndicator=document.createElement("div");
  tempoIndicator.style.display="flex";
  tempoIndicator.style.flexDirection="column";
  tempoIndicator.style.alignItems="center";
  tempoIndicator.style.justifyContent="center";
  tempoIndicator.style.gap="7px";
  tempoIndicator.style.minHeight=timingSize+"px";
  const tapLabel=document.createElement("div");
  tapLabel.textContent="TAP";
  tapLabel.className="ms-control-label";
  tempoIndicator.appendChild(tapLabel);
  timingGrid.appendChild(tempoIndicator);
  const tempoLed=R.mount(tempoIndicator,{
    id:"rearranger-tempo-led",
    control:"led",
    label:""
  });
  const bpmLabel=document.createElement("div");
  bpmLabel.textContent="BPM";
  bpmLabel.className="ms-control-label";
  tempoIndicator.appendChild(bpmLabel);

  const bpmReadoutHost=document.createElement("div");
  bpmReadoutHost.style.minWidth="0";
  bpmReadoutHost.style.minHeight=timingSize+"px";
  timingGrid.appendChild(bpmReadoutHost);
  const bpmReadout=styleRearrangerReadout(CS.mountReadout(bpmReadoutHost,{id:"rearranger-bpm-readout",rows:1,columns:3,text:"120",lit:false}));
  bpmReadout.root.style.height=timingSize+"px";

  const bpmKnob=R.mount(timingGrid,{id:"rearranger-bpm",control:"knob",label:"BPM",value:{default:120,min:30,max:300,step:1}},{
    visual:{size:timingSize,touchSize:92}
  });
  let internalBpm=120,tapTimes=[];
  let beatTimer=0;
  const flashBeat=()=>{
    tempoLed.dataset.on="1";
    setTimeout(()=>{tempoLed.dataset.on="0"},90);
  };
  const restartBeatTimer=()=>{
    clearInterval(beatTimer);
    flashBeat();
    beatTimer=setInterval(flashBeat,60000/internalBpm);
  };

  const setBpm=value=>{
    internalBpm=Math.max(30,Math.min(300,Math.round(Number(value)||120)));
    R.setValue(bpmKnob,internalBpm,String(internalBpm));
    bpmReadout.set(String(internalBpm).padStart(3,"0").slice(-3));
    restartBeatTimer();
  };
  timingPad.addEventListener("click",()=>{
    const now=performance.now();
    if(tapTimes.length&&now-tapTimes[tapTimes.length-1]>2000)tapTimes=[];
    tapTimes.push(now);
    if(tapTimes.length>5)tapTimes.shift();
    if(tapTimes.length>1){
      const intervals=[];
      for(let i=1;i<tapTimes.length;i++)intervals.push(tapTimes[i]-tapTimes[i-1]);
      setBpm(60000/(intervals.reduce((a,b)=>a+b,0)/intervals.length));
    }
  });
  bpmKnob.addEventListener("multisynth-control-knob-delta",e=>setBpm(internalBpm+(e.detail?.delta||0)*270));
  setBpm(internalBpm);

  const knobLabels={
    CLIP:["LEVEL","PAN","RATE","LOOP"],
    STANZA:["REPEAT","LENGTH","FOLLOW","LOCK"],
    SONG:["REPEAT","OFFSET","FOLLOW","LOOP"],
    LIVE:["QUANTIZE","OFFSET","FOLLOW","HOLD"]
  };
  const encoderLabels={
    CLIP:["START","END"],
    STANZA:["FIRST","LAST"],
    SONG:["FROM","TO"],
    LIVE:["CUE","TARGET"]
  };

  const labelNode=(node,text)=>{
    const label=node.querySelector(".ms-control-label");
    if(label)label.textContent=text;
  };

  const current=()=>state.contexts[state.context];
  const cancelEncoderDrag=node=>{const drag=node.__msEncoderCircular;if(!drag)return;drag.pointer=null;drag.active=false};
  const paintContextReadout=()=>{const ctx=current(),labels=encoderLabels[state.context];readout.set(`REARRANGER ${state.context}  ${labels[0]} ${ctx.left.toFixed(3)}  ${labels[1]} ${ctx.right.toFixed(3)}`)};
  let boundContext=null;

  function bindContext(){
    const contextName=state.context,ctx=current(),labels=encoderLabels[contextName],contextChanged=boundContext!==contextName;
    if(contextChanged){cancelEncoderDrag(encLeft);cancelEncoderDrag(encRight)}
    if(!Array.isArray(ctx.knobLocks))ctx.knobLocks=Array(4).fill(false);
    labelNode(encLeft,labels[0]);
    labelNode(encRight,labels[1]);
    encLeft.__rearrangerBinding={key:`rearranger.${contextName}.encoder.left`,context:contextName,stateKey:"left"};
    encRight.__rearrangerBinding={key:`rearranger.${contextName}.encoder.right`,context:contextName,stateKey:"right"};
    encLeft.dataset.bindingKey=encLeft.__rearrangerBinding.key;
    encRight.dataset.bindingKey=encRight.__rearrangerBinding.key;
    R.setValue(encLeft,ctx.left,ctx.left.toFixed(3));
    R.setValue(encRight,ctx.right,ctx.right.toFixed(3));

    knobs.forEach((node,i)=>{
      const binding={
        key:`rearranger.${contextName}.knob.${i}`,
        get value(){return state.contexts[contextName].knobs[i]},
        set value(v){state.contexts[contextName].knobs[i]=clamp(Number(v)||0);persist()},
        get locked(){return !!state.contexts[contextName].knobLocks?.[i]},
        set locked(v){const target=state.contexts[contextName];if(!Array.isArray(target.knobLocks))target.knobLocks=Array(4).fill(false);target.knobLocks[i]=!!v;persist()}
      };
      node.__rearrangerBinding=binding;
      node.dataset.bindingKey=binding.key;
      R.bindKnob(node,binding);
      labelNode(node,knobLabels[contextName][i]);
    });

    modeButtons.forEach((node,i)=>R.bindButton(node,{on:modes[i]===contextName}));
    boundContext=contextName;
    paintContextReadout();
  }

  function moveEncoder(node,delta){
    const binding=node.__rearrangerBinding;if(!binding)return;
    const ctx=state.contexts[binding.context],key=binding.stateKey,step=delta/(Math.PI*2);
    ctx[key]=clamp(ctx[key]+step);
    if(key==="left"&&ctx.left>ctx.right)ctx.left=ctx.right;
    if(key==="right"&&ctx.right<ctx.left)ctx.right=ctx.left;
    R.setValue(node,ctx[key],ctx[key].toFixed(3));
    persist();
    if(binding.context===state.context)paintContextReadout();
  }

  encLeft.addEventListener("multisynth-control-circular-drag",e=>{if(e.detail?.active)moveEncoder(encLeft,e.detail.deltaRadians||0)});
  encRight.addEventListener("multisynth-control-circular-drag",e=>{if(e.detail?.active)moveEncoder(encRight,e.detail.deltaRadians||0)});

  knobs.forEach((node,i)=>{
    node.addEventListener("multisynth-control-knob-delta",e=>{
      const b=node.__rearrangerBinding;
      if(!b)return;
      const next=clamp(Number(b.value)+(e.detail?.delta||0));
      node.commitControlValue?.(next);
      bindContext();
    });
  });

  modeButtons.forEach((node,i)=>node.addEventListener("click",()=>{
    state.context=modes[i];
    persist();
    bindContext();
  }));

  actionButtons[0].addEventListener("click",()=>{
    const i=modes.indexOf(state.context);
    state.context=modes[(i+modes.length-1)%modes.length];
    persist();bindContext();
  });
  actionButtons[1].addEventListener("click",()=>{
    const i=modes.indexOf(state.context);
    state.context=modes[(i+1)%modes.length];
    persist();bindContext();
  });
  actionButtons[2].addEventListener("click",()=>readout.set(`QUEUED ${state.context}`));
  actionButtons[3].addEventListener("click",()=>{
    state.contexts[state.context]=copy(seed.contexts[state.context]);
    persist();bindContext();
  });

  transportButtons[0].addEventListener("click",()=>readout.set("BACK"));
  transportButtons[1].addEventListener("click",()=>readout.set("PLAY"));
  transportButtons[2].addEventListener("click",()=>readout.set("STOP"));
  transportButtons[3].addEventListener("click",()=>readout.set("FWD"));

  const keyboardHost=document.getElementById("performanceKeyboard");
  if(keyboardHost&&MS.PerformanceKeyboard?.mount){
    document.body.classList.add("hasPinnedKeyboard");
    const keyboard=MS.PerformanceKeyboard.mount(keyboardHost,{audio:A});
    const cleanup=()=>{
      clearInterval(beatTimer);
      readoutObserver.disconnect();
      document.body.classList.remove("hasPinnedKeyboard");
      try{keyboard?.destroy?.()}catch(_){}
    };
    addEventListener("pagehide",cleanup,{once:true});
    addEventListener("beforeunload",cleanup,{once:true});
  }

  bindContext();
})();
