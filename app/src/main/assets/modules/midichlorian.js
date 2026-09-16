"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds;
  if(!C||!I)return;

  const defaults=()=>({enabled:true});
  function send(packet={}){
    const status=Number(packet.status)&255,command=status&0xf0;
    if(command<0x80||command>0xe0)return false;
    return global.MultiSynthNativeMidi?.sendPacket?.(packet)===true;
  }
  function create(api){
    const eventName=MS.Events?.MODULE||"multisynth-module";
    const user={enabled:api.state.enabled!==false,eventName,onModule:null};
    const active=()=>user.enabled&&MS.NodeGraphEngine?.getModule?.(api.instanceId)?.enabled!==false;
    user.onModule=event=>{
      const d=event?.detail;
      if(!active()||d?.type!=="midi"||d?.instanceId===api.instanceId)return;
      send(d.payload||{});
    };
    global.addEventListener(eventName,user.onModule);
    return user;
  }
  function setState({runtime,state}){if(runtime.user)runtime.user.enabled=state.enabled!==false;}
  function midiMessage({runtime},packet){return runtime.user?.enabled!==false&&send(packet);}
  function destroy({runtime}){const u=runtime.user;if(u?.onModule)global.removeEventListener(u.eventName,u.onModule);}

  C.define({type:I.MIDICHLORIAN,version:1,category:"routing",description:"MIDIchlorian · physical MIDI output sink for MultiSynth channel messages; MIDI realtime clock remains owned by Father Time",defaults:defaults(),resources:["midi"],create,setState,midiMessage,destroy,serialize:({state})=>({enabled:state.enabled!==false}),restore:({saved})=>({enabled:saved?.enabled!==false})});
  C.defineSurface(I.MIDICHLORIAN,{version:1,package:{id:I.MIDICHLORIAN,version:1,behavior:{role:"physical-midi-output",midiBus:"shared",realtimeOwner:"father-time",stateOwnership:"module"}},faceplate:{livery:"midichlorian",primary:"#132215",secondary:"#8bcf7a",tertiary:"#dfffd9"},defaults:defaults(),controls:[{id:"enabled",control:"switch",state:"enabled",label:"MIDI OUT"}]});
})(window);
