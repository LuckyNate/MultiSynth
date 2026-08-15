"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
const TYPES=["puresynth","quadsynth","pulsynth","sinladder","razorback","stinger","noquarter"];
const clean=s=>{const x={...(s||{})};delete x.level;delete x.carrier;return x};
for(const type of TYPES){
  let old;try{old=C.getDefinition(type)}catch(_){continue}
  const defaults=clean(old.defaults);
  C.define({
    ...old,
    version:String(old.version)+"-no-generic-gain",
    defaults,
    create:old.create?api=>{
      const state=clean(api.state);
      const wrapped={
        instanceId:api.instanceId,
        state,
        context:api.context,
        native:api.native,
        rack:api.rack,
        setInput:n=>api.setInput(n),
        setOutput:n=>api.setOutput(n),
        setUser:v=>api.setUser(v),
        subscribe:x=>api.subscribe(x),
        unsubscribe:x=>api.unsubscribe(x),
        emit:(t,p)=>api.emit(t,p)
      };
      return old.create(wrapped);
    }:null,
    setState:old.setState?({runtime,state,patch})=>old.setState({runtime,state:clean(state),patch:clean(patch)}):null,
    serialize:({runtime,state})=>clean(old.serialize?old.serialize({runtime,state:clean(state)}):state),
    restore:({runtime,saved})=>clean(old.restore?old.restore({runtime,saved:clean(saved)}):saved)
  });
}
})(window);
