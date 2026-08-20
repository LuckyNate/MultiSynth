"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,Defs=MS.ModuleBuilderDefinitions;if(!C||!I||!Defs)return;const model=Defs.require(I.TXRXR);const defaults=()=>JSON.parse(JSON.stringify(model.defaults));
function enabled(u,kind){if(u.state.enabled===false)return false;return(u.state.mappings||[]).some(m=>m?.enabled&&String(m.source)===kind)}
function receive(u,kind,payload,sourceTxId,sourceInstanceId){if(u.state.enabled===false)return;u.lastReceive={kind,payload,sourceTxId,sourceInstanceId};if(kind==="cv"||kind==="dv")u.onWirelessEvent?.(kind,payload,sourceTxId);if(kind==="clock")u.onWirelessClock?.(payload,sourceTxId);}
function create(api){const c=api.context,input=c.createGain(),output=c.createGain();input.connect(output);api.setInput(input);api.setOutput(output);const u={id:api.instanceId,ctx:c,input,output,state:api.state,lastReceive:null,onWirelessEvent:null,onWirelessClock:null};const d=MS.TXRXRBus?.register(u.id,{txId:u.state.txId,parentTxIds:u.state.parentTxIds},{receive:(k,p,tx,src)=>receive(u,k,p,tx,src)});if(d?.txId&&u.state.txId!==d.txId){u.state.txId=d.txId;api.updateState?.({txId:d.txId})}return u}
function setState({runtime,state,patch}){const u=runtime.user;if(!u)return;u.state=state;if("txId" in patch||"parentTxIds" in patch)MS.TXRXRBus?.update(u.id,{txId:state.txId,parentTxIds:state.parentTxIds})}
function cv({runtime},packet={}){const u=runtime.user;if(!u)return packet;const kind=packet.kind==="dv"?"dv":"cv";if(enabled(u,kind))MS.TXRXRBus?.send(u.id,kind,packet);return packet}
function clockTick({runtime},tick={}){const u=runtime.user;if(!u)return false;if(enabled(u,"clock"))MS.TXRXRBus?.send(u.id,"clock",tick);return true}
function destroy({runtime}){const u=runtime.user;if(!u)return;MS.TXRXRBus?.unregister(u.id);for(const n of[u.input,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.TXRXR,version:"2-module-builder",description:"WIRELESS PATCH CABLE PORTING · SELECT UPSTREAM TX PARENTS · SIMULTANEOUS RX+TX · DIRECT PARENTS TO ALL DIRECT CHILDREN",defaults:defaults(),create,setState,cv,clockTick,destroy,moduleBuilder:model});
})(window);
