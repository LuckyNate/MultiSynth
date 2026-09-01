"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;if(!C||!I)return;
const defaults={channels:{}};
const channelState=(state,index)=>state?.channels?.[index]||state?.channels?.[String(index)]||{level:1,mute:false,solo:false};
function apply(u,state){const solo=Object.values(state?.channels||{}).some(c=>c?.solo);for(const[index,gain]of u.inputs){const c=channelState(state,index),level=Math.max(0,Math.min(1,Number(c.level??1))),muted=!!c.mute||(solo&&!c.solo);gain.gain.value=muted?0:level}}
function create(api){const ctx=api.context,output=ctx.createGain(),inputs=new Map();const u={inputs,output,input(index){index=Math.max(0,index|0);let g=inputs.get(index);if(!g){g=ctx.createGain();g.connect(output);inputs.set(index,g);apply(u,api.state)}return g},sync(state){apply(u,state)}};api.setInput(u.input(0));api.setOutput(output);return u}
C.define({type:I.ALCHEMY_MIXER,version:"module-1",description:"DYNAMIC OUTPUT MIXER",defaults,create,setState({runtime,state}){runtime.user?.sync(state)},destroy({runtime}){for(const g of runtime.user?.inputs?.values?.()||[])try{g.disconnect()}catch(_){}try{runtime.user?.output?.disconnect()}catch(_){}},serialize:({state})=>({channels:{...(state.channels||{})}}),restore:({saved})=>({channels:{...(saved?.channels||{})}})});
B?.define?.({id:I.ALCHEMY_MIXER,family:"SIGNAL PROCESSORS",model:"module-builder",version:1,package:{id:I.ALCHEMY_MIXER,version:1,behavior:{role:"dynamic-output-mixer",inputs:"used-plus-one",channelControls:"level-mute-solo",stateOwnership:"module"}},faceplate:{livery:"wood-console",primary:"#4b2d17",secondary:"#9a6734",tertiary:"#d6aa68"},defaults,controls:[],sources:[{id:"source.inputs",type:"audioInput",mode:"dynamic-used-plus-one"}],actions:[{id:"action.mix",type:"level-mute-solo"}],nodes:{connections:[["source.inputs","action.mix"]]}});
})(window);
