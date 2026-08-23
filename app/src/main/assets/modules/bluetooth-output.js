"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;if(!C||!I)return;
const defaults={status:"SYSTEM BLUETOOTH ROUTE"};
function create(api){const c=api.context,input=c.createGain(),output=c.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{input,output}}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.output])try{n.disconnect()}catch(_){}}
C.define({type:I.BLUETOOTH_OUTPUT,version:"module-builder-1",description:"GENERAL BLUETOOTH CARRIER OUTPUT · CONNECTED MEANS PLAYING",defaults,resources:["nativeAudio"],create,destroy,serialize:({state})=>({...state}),restore:({saved})=>({...defaults,...(saved||{})})});
B?.define?.({id:I.BLUETOOTH_OUTPUT,family:"SIGNAL PROCESSORS",model:"module-builder",version:1,package:{id:I.BLUETOOTH_OUTPUT,version:1,behavior:{role:"general-bluetooth-output-terminal",routing:"carrier-to-current-system-bluetooth-endpoint",activation:"automatic-when-bluetooth-connected",controls:"none",carSafety:"car-endpoints-remain-tail-gator-gated",stateOwnership:"module-builder"}},faceplate:{livery:"bluetooth-output",primary:"#07131f",secondary:"#6fb7ff",tertiary:"#e6f3ff"},defaults,controls:[{id:"status",control:"display",state:"status",label:"BLUETOOTH OUTPUT",node:"indicator.status"}],sources:[{id:"source.audio",type:"audioInput"}],actions:[{id:"action.route",type:"terminalSystemBluetoothRoute",mode:"automatic"}],nodes:{connections:[["source.audio","action.route"],["action.route","indicator.status"]]}})
})(window);
