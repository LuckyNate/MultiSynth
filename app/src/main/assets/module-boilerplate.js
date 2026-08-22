"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  const ROLE=Object.freeze({
    ROOT:"root",
    PROCESSOR:"processor",
    GENERATOR:"generator",
    HYBRID:"hybrid",
    UTILITY:"utility",
    TERMINAL:"terminal"
  });
  const PORT=Object.freeze({
    CV_IN:"cvIn",
    CV_OUT:"cvOut",
    CARRIER_IN:"carrierIn",
    CARRIER_OUT:"carrierOut",
    CARRIER_BYPASS:"carrierBypass"
  });
  const ROOT_PORTS=Object.freeze([PORT.CV_IN,PORT.CV_OUT]);
  const CHILDREN=Object.freeze({
    [ROLE.ROOT]:Object.freeze({role:ROLE.ROOT,ports:ROOT_PORTS}),
    [ROLE.PROCESSOR]:Object.freeze({role:ROLE.PROCESSOR,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_IN,PORT.CARRIER_OUT,PORT.CARRIER_BYPASS])}),
    [ROLE.GENERATOR]:Object.freeze({role:ROLE.GENERATOR,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_OUT])}),
    [ROLE.HYBRID]:Object.freeze({role:ROLE.HYBRID,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_IN,PORT.CARRIER_OUT,PORT.CARRIER_BYPASS])}),
    [ROLE.UTILITY]:Object.freeze({role:ROLE.UTILITY,ports:ROOT_PORTS}),
    [ROLE.TERMINAL]:Object.freeze({role:ROLE.TERMINAL,ports:Object.freeze([...ROOT_PORTS,PORT.CARRIER_IN])})
  });
  function requireRole(role){const r=String(role||ROLE.ROOT);const spec=CHILDREN[r];if(!spec)throw new Error("Unknown module boilerplate role: "+r);return spec}
  function infer(capabilities=[],routing={}){const c=new Set(Array.isArray(capabilities)?capabilities:[]),audioIn=c.has("audioInput"),audioOut=c.has("audioOutput"),generator=c.has("generator"),terminal=c.has("terminalOutput")||routing?.audioRole==="terminal";if(terminal)return ROLE.TERMINAL;if(audioIn&&audioOut&&generator)return ROLE.HYBRID;if(audioIn&&audioOut)return ROLE.PROCESSOR;if(audioOut)return ROLE.GENERATOR;return ROLE.UTILITY}
  function hasPort(role,port){return requireRole(role).ports.includes(port)}
  function describe(role){const s=requireRole(role);return Object.freeze({role:s.role,ports:s.ports.slice(),root:Object.freeze({identity:true,state:true,lifecycle:true,cvIn:true,cvOut:true})})}
  MS.ModuleBoilerplate=Object.freeze({ROLE,PORT,ROOT_PORTS,CHILDREN,require:requireRole,infer,hasPort,describe});
})(window);
