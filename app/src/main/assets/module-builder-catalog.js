"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const I=MS.ModuleIds,M=MS.ModuleManifest,S=MS.StateSchema,B=MS.ModuleBuilderDefinitions;
  if(!I||!M||!S||!B)return;
  const capSource=Object.freeze({
    audioInput:{id:"source.audio",type:"audioInput"},
    noteInput:{id:"source.note",type:"noteInput"},
    cvInput:{id:"source.cv",type:"cvInput"},
    clockFollower:{id:"source.clock",type:"clockFollower"},
    dvInput:{id:"source.dv",type:"dvInput",consume:true},
    mic:{id:"source.mic",type:"micInput"},
    midi:{id:"source.midi",type:"midiInput"},
    pcm:{id:"source.pcm",type:"pcmInput"}
  });
  const capAction=Object.freeze({
    audioOutput:{id:"action.audio",type:"audioOutput"},
    generator:{id:"action.generate",type:"generator"},
    cvOutput:{id:"action.cv",type:"cvOutput"},
    clockSource:{id:"action.clock",type:"clockSource"},
    terminalOutput:{id:"action.terminal",type:"terminalOutput"}
  });
  function sourcesFor(caps){return Object.freeze((caps||[]).map(c=>capSource[c]).filter(Boolean).map(x=>Object.freeze({...x})))}
  function actionsFor(caps){return Object.freeze((caps||[]).map(c=>capAction[c]).filter(Boolean).map(x=>Object.freeze({...x})))}
  function build(id){
    const meta=M.require(id),version=S.versionFor(id,1),sources=sourcesFor(meta.capabilities),actions=actionsFor(meta.capabilities);
    return {
      id:meta.id,
      model:"module-builder",
      version,
      displayName:meta.displayName,
      category:meta.category,
      stateSchemaVersion:version,
      capabilities:[...meta.capabilities],
      resources:[...meta.resources],
      package:{id:meta.id,version,behavior:{framework:"module-builder",routing:meta.routing}},
      faceplate:{livery:meta.themeKey,primary:meta.color,secondary:meta.color,tertiary:meta.color},
      defaults:{},
      controls:[],
      sources:[...sources],
      actions:[...actions],
      nodes:{connections:[]}
    };
  }
  const added=[];
  for(const id of I.ALL){if(B.get(id))continue;B.define(build(id));added.push(id)}
  MS.ModuleBuilderCatalog=Object.freeze({all:()=>Object.freeze(I.ALL.map(id=>B.require(id))),added:Object.freeze(added.slice()),complete:I.ALL.every(id=>!!B.get(id))});
})(window);
