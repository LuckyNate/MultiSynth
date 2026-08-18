"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
function create(api){
  const c=api.context,input=c.createGain(),output=c.createGain();
  input.connect(output);api.setInput(input);api.setOutput(output);
  return {ctx:c,input,output};
}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.output])try{n.disconnect();}catch(_){}}
C.define({
  type:"tail-gator",
  displayName:"Tail Gator",
  category:"output",
  version:"tail-gator-1",
  editorUrl:"tail-gator.html",
  color:"#f28c28",
  selectorClass:"tail-gator",
  description:"TERMINAL CAR / EXTERNAL OUTPUT · EXPLICIT OPT-IN ONLY",
  defaults:{armed:false,sinkId:""},
  create,
  setState({runtime,state}){
    const ev=new CustomEvent("multisynth-tail-gator",{detail:{instanceId:runtime.instanceId,armed:!!state.armed,sinkId:String(state.sinkId||"")}});
    global.dispatchEvent(ev);
  },
  destroy,
  serialize:({state})=>({...state}),
  restore:({saved})=>({armed:false,sinkId:"",...(saved||{})})
});
})(window);
