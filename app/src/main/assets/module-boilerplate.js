"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const ROLE=Object.freeze({ROOT:"root",PROCESSOR:"processor",GENERATOR:"generator",HYBRID:"hybrid",UTILITY:"utility",TERMINAL:"terminal"});
  const PORT=Object.freeze({CV_IN:"cvIn",CV_OUT:"cvOut",CARRIER_IN:"carrierIn",CARRIER_OUT:"carrierOut",CARRIER_BYPASS:"carrierBypass"});
  const ROOT_PORTS=Object.freeze([PORT.CV_IN,PORT.CV_OUT]);
  const CHILDREN=Object.freeze({
    [ROLE.ROOT]:Object.freeze({role:ROLE.ROOT,ports:ROOT_PORTS}),
    [ROLE.PROCESSOR]:Object.freeze({role:ROLE.PROCESSOR,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_IN,PORT.CARRIER_OUT,PORT.CARRIER_BYPASS])}),
    [ROLE.GENERATOR]:Object.freeze({role:ROLE.GENERATOR,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_OUT])}),
    [ROLE.HYBRID]:Object.freeze({role:ROLE.HYBRID,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_IN,PORT.CARRIER_OUT,PORT.CARRIER_BYPASS])}),
    [ROLE.UTILITY]:Object.freeze({role:ROLE.UTILITY,ports:ROOT_PORTS}),
    [ROLE.TERMINAL]:Object.freeze({role:ROLE.TERMINAL,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_IN])})
  });
  const lifecycle=Object.freeze(["create","setState","serialize","restore","destroy"]);
  function requireRole(role){const r=String(role||ROLE.ROOT),spec=CHILDREN[r];if(!spec)throw new Error("Unknown module boilerplate role: "+r);return spec}
  function infer(capabilities=[],routing={}){const c=new Set(Array.isArray(capabilities)?capabilities:[]),audioIn=c.has("audioInput"),audioOut=c.has("audioOutput"),generator=c.has("generator"),terminal=c.has("terminalOutput")||routing?.audioRole==="terminal";if(terminal)return ROLE.TERMINAL;if(audioIn&&audioOut&&generator)return ROLE.HYBRID;if(audioIn&&audioOut)return ROLE.PROCESSOR;if(audioOut)return ROLE.GENERATOR;return ROLE.UTILITY}
  function hasPort(role,port){return requireRole(role).ports.includes(port)}
  function describe(role){const s=requireRole(role);return Object.freeze({role:s.role,ports:s.ports.slice(),root:Object.freeze({identity:true,state:true,lifecycle:lifecycle.slice(),cvIn:true,cvOut:true})})}
  function define(role,definition={}){const spec=requireRole(role);return Object.freeze({...definition,boilerplateRole:spec.role,boilerplatePorts:spec.ports.slice()})}
  function root(def){return define(ROLE.ROOT,def)}function processor(def){return define(ROLE.PROCESSOR,def)}function generator(def){return define(ROLE.GENERATOR,def)}function hybrid(def){return define(ROLE.HYBRID,def)}function utility(def){return define(ROLE.UTILITY,def)}function terminal(def){return define(ROLE.TERMINAL,def)}
  function carrier(api,role,{input=null,output=null}={}){const spec=requireRole(role),out={input:null,output:null,bypass:null};if(spec.ports.includes(PORT.CARRIER_IN)){if(!input)throw new Error(role+" boilerplate requires carrier input");out.input=api.setInput(input);if(spec.ports.includes(PORT.CARRIER_BYPASS)){const c=api.context;if(!c?.createGain)throw new Error("Carrier bypass requires AudioContext");out.bypass=c.createGain();out.bypass.gain.value=1;out.input.connect(out.bypass)}}if(spec.ports.includes(PORT.CARRIER_OUT)){if(!output)throw new Error(role+" boilerplate requires carrier output");out.output=api.setOutput(output)}return out}
  MS.ModuleBoilerplate=Object.freeze({ROLE,PORT,ROOT_PORTS,CHILDREN,lifecycle,require:requireRole,infer,hasPort,describe,define,root,processor,generator,hybrid,utility,terminal,carrier});
})(window);
