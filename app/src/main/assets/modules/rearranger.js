"use strict";
(function(global){
  const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;
  if(!C||!I||!B)throw new Error("Rearranger requires ModuleContract, ModuleIds and ModuleBuilderDefinitions");

  const makeContext=(left=0,right=1,a=.5,b=.5,c=.5,d=.5)=>({left,right,knobs:[a,b,c,d]});
  const defaults=()=>({
    context:"CLIP",
    contexts:{
      CLIP:makeContext(0,1,.8,0,1,1),
      STANZA:makeContext(0,1,1,.25,1,0),
      SONG:makeContext(0,1,1,0,1,1),
      LIVE:makeContext(0,1,1,0,1,0)
    }
  });

  const model=B.define({
    id:I.REARRANGER,
    model:"module-builder",
    version:10,
    package:{
      id:I.REARRANGER,
      version:10,
      behavior:{
        role:"contextual-arrangement-controller",
        timing:"clock-only",
        stateOwnership:"module-builder",
        contextualControls:"stable-binding-identity"
      }
    },
    faceplate:{
      livery:"default",
      primary:"#202020",
      secondary:"#d8d8d8",
      tertiary:"#e8e8e8"
    },
    defaults:defaults(),
    controls:[
      {id:"left",control:"encoder",label:"LEFT",value:{default:0,min:0,max:1,step:.001},node:"controller.left"},
      {id:"right",control:"encoder",label:"RIGHT",value:{default:1,min:0,max:1,step:.001},node:"controller.right"},
      {id:"context-1",control:"knob",label:"PARAM 1",value:{default:.5,min:0,max:1,step:.001},node:"controller.context1"},
      {id:"context-2",control:"knob",label:"PARAM 2",value:{default:.5,min:0,max:1,step:.001},node:"controller.context2"},
      {id:"context-3",control:"knob",label:"PARAM 3",value:{default:.5,min:0,max:1,step:.001},node:"controller.context3"},
      {id:"context-4",control:"knob",label:"PARAM 4",value:{default:.5,min:0,max:1,step:.001},node:"controller.context4"},
      {id:"clip-mode",control:"button",label:"CLIP",node:"controller.clip"},
      {id:"stanza-mode",control:"button",label:"STANZA",node:"controller.stanza"},
      {id:"song-mode",control:"button",label:"SONG",node:"controller.song"},
      {id:"live-mode",control:"button",label:"LIVE",node:"controller.live"},
      B.Controls.performanceKeyboard({id:"keyboard"})
    ],
    sources:[],
    actions:[
      {id:"action.context",type:"selectContext"},
      {id:"action.rebind",type:"rebindContextControls"}
    ],
    nodes:{connections:[]}
  });

  C.define({
    type:I.REARRANGER,
    version:"module-builder-10",
    description:"CONTEXTUAL CLOCK-DRIVEN ARRANGEMENT CONTROLLER",
    defaults:defaults(),
    moduleBuilder:model
  });
})(window);
