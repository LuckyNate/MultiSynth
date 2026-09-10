"use strict";
(function(){
  const q=new URLSearchParams(location.search),instance=q.get("instance");
  const P=parent.MultiSynth||{},E=P.NodeGraphEngine,A=P.NodeAudioGraph;
  const MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,CS=MS.ControlSurface;
  const root=document.getElementById("controls");
  if(!root||!R||!CS)return;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const copy=v=>JSON.parse(JSON.stringify(v));
  const seed={
    context:"CLIP",
    contexts:{
      CLIP:{left:0,right:1,knobs:[.8,0,1,1]},
      STANZA:{left:0,right:1,knobs:[1,.25,1,0]},
      SONG:{left:0,right:1,knobs:[1,0,1,1]},
      LIVE:{left:0,right:1,knobs:[1,0,1,0]}
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

  const bank=document.createElement("section");
  bank.className="ms-module-bank";
  const grid=document.createElement("div");
  grid.className="ms-control-grid";
  grid.style.gridTemplateColumns="repeat(24,minmax(0,1fr))";
  bank.appendChild(grid);
  root.appendChild(bank);

  const slot=(node,column,row)=>{
    node.style.gridColumn=column;
    node.style.gridRow=String(row);
    node.style.minWidth="0";
    return node;
  };

  const readoutHost=document.createElement("div");
  readoutHost.style.gridColumn="1 / span 24";
  readoutHost.style.gridRow="1";
  readoutHost.style.minWidth="0";
  grid.appendChild(readoutHost);
  const readout=CS.mountReadout(readoutHost,{id:"rearranger-readout",rows:8,columns:20,text:"REARRANGER  CLIP",lit:false});

  const encLeft=slot(R.mount(grid,{id:"rearranger-left",control:"encoder",label:"LEFT",value:{default:0,min:0,max:1,step:.001}}),"1 / span 12",2);
  const encRight=slot(R.mount(grid,{id:"rearranger-right",control:"encoder",label:"RIGHT",value:{default:1,min:0,max:1,step:.001}}),"13 / span 12",2);

  const knobs=[0,1,2,3].map(i=>slot(R.mount(grid,{
    id:"rearranger-knob-"+(i+1),
    control:"knob",
    label:"PARAM "+(i+1),
    value:{default:.5,min:0,max:1,step:.001}
  }),`${1+i*6} / span 6`,3));

  const modes=["CLIP","STANZA","SONG","LIVE"];
  const modeButtons=modes.map((name,i)=>slot(R.mount(grid,{
    id:"rearranger-mode-"+name.toLowerCase(),
    control:"button",
    label:name
  }),`${1+i*6} / span 6`,4));

  const actionNames=["PREV","NEXT","QUEUE","CLEAR"];
  const actionButtons=actionNames.map((name,i)=>slot(R.mount(grid,{
    id:"rearranger-action-"+name.toLowerCase(),
    control:"button",
    label:name
  }),`${1+i*6} / span 6`,5));

  const timingPad=slot(R.mount(grid,{id:"rearranger-tap-tempo",control:"pad",label:"TAP"}),"1 / span 6",6);

  const bpmReadoutHost=document.createElement("div");
  bpmReadoutHost.style.gridColumn="7 / span 6";
  bpmReadoutHost.style.gridRow="6";
  bpmReadoutHost.style.minWidth="0";
  grid.appendChild(bpmReadoutHost);
  const bpmReadout=CS.mountReadout(bpmReadoutHost,{id:"rearranger-bpm-readout",rows:1,columns:3,text:"120",lit:false});

  const bpmKnob=slot(R.mount(grid,{id:"rearranger-bpm",control:"knob",label:"BPM",value:{default:120,min:30,max:300,step:1}}),"13 / span 12",6);
  let internalBpm=120,tapTimes=[];
  const setBpm=value=>{
    internalBpm=Math.max(30,Math.min(300,Math.round(Number(value)||120)));
    R.setValue(bpmKnob,internalBpm,String(internalBpm));
    bpmReadout.set(String(internalBpm).padStart(3,"0").slice(-3));
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

  const transportNames=["BACK","PLAY","STOP","FWD"];
  const transportButtons=transportNames.map((name,i)=>slot(R.mount(grid,{
    id:"rearranger-transport-"+name.toLowerCase(),
    control:"button",
    label:name
  }),`${1+i*6} / span 6`,5));

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

  function bindContext(){
    const ctx=current();
    const labels=encoderLabels[state.context];
    labelNode(encLeft,labels[0]);
    labelNode(encRight,labels[1]);
    R.setValue(encLeft,ctx.left,ctx.left.toFixed(3));
    R.setValue(encRight,ctx.right,ctx.right.toFixed(3));

    knobs.forEach((node,i)=>{
      const binding={
        key:`rearranger.${state.context}.knob.${i}`,
        get value(){return current().knobs[i]},
        set value(v){current().knobs[i]=clamp(Number(v)||0);persist()},
        locked:false
      };
      node.__rearrangerBinding=binding;
      R.bindKnob(node,binding);
      labelNode(node,knobLabels[state.context][i]);
    });

    modeButtons.forEach((node,i)=>R.bindButton(node,{on:modes[i]===state.context}));
    readout.set(`REARRANGER ${state.context}  ${labels[0]} ${ctx.left.toFixed(3)}  ${labels[1]} ${ctx.right.toFixed(3)}`);
  }

  function moveEncoder(node,key,delta){
    const ctx=current();
    const step=delta/(Math.PI*2);
    ctx[key]=clamp(ctx[key]+step);
    if(key==="left"&&ctx.left>ctx.right)ctx.left=ctx.right;
    if(key==="right"&&ctx.right<ctx.left)ctx.right=ctx.left;
    R.setValue(node,ctx[key],ctx[key].toFixed(3));
    persist();
    bindContext();
  }

  encLeft.addEventListener("multisynth-control-circular-drag",e=>{if(e.detail?.active)moveEncoder(encLeft,"left",e.detail.deltaRadians||0)});
  encRight.addEventListener("multisynth-control-circular-drag",e=>{if(e.detail?.active)moveEncoder(encRight,"right",e.detail.deltaRadians||0)});

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
      document.body.classList.remove("hasPinnedKeyboard");
      try{keyboard?.destroy?.()}catch(_){}
    };
    addEventListener("pagehide",cleanup,{once:true});
    addEventListener("beforeunload",cleanup,{once:true});
  }

  bindContext();
})();
