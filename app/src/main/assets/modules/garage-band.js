"use strict";
(function(global){
const MS=global.MultiSynth||{},C=MS.ModuleContract,I=MS.ModuleIds,B=MS.ModuleBuilderDefinitions;if(!C||!I)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const defaults={frequency:1200,width:1};
function create(api){const c=api.context;if(!c)return{};const input=c.createGain(),filter=c.createBiquadFilter(),output=c.createGain();filter.type="bandpass";input.connect(filter).connect(output);api.setInput(input);api.setOutput(output);const u={ctx:c,input,filter,output};apply(u,api.state);return u;}
function apply(u,s){const now=u.ctx.currentTime;u.filter.frequency.setTargetAtTime(clamp(s.frequency??1200,20,20000),now,.015);u.filter.Q.setTargetAtTime(clamp(s.width??1,.1,20),now,.015);}
function destroy({runtime}){const u=runtime.user;if(!u)return;for(const n of [u.input,u.filter,u.output])try{n.disconnect();}catch(_){}}
C.define({type:I.GARAGE_BAND,version:"module-builder-2-bandpass",description:"70S AVOCADO BAND-PASS FILTER · FREQUENCY · WIDTH",defaults,create,setState({runtime,state}){if(runtime.user?.ctx)apply(runtime.user,state);},destroy,serialize:({state})=>({...state}),restore:({saved})=>({...defaults,...(saved||{})})});
B?.define?.({id:I.GARAGE_BAND,model:"module-builder",version:2,package:{id:I.GARAGE_BAND,version:2,behavior:{role:"band-pass-filter",stateOwnership:"module-builder"}},faceplate:{livery:"seventies-avocado-amp",primary:"#303319",secondary:"#8b8b5a",tertiary:"#ebe8b2"},defaults,controls:[{id:"frequency",control:"knob",state:"frequency",label:"FREQUENCY",value:{default:1200,min:20,max:20000,step:1},meta:{unit:"Hz",scale:"logarithmic",visual:"amp-knob"},node:"controller.frequency"},{id:"width",control:"knob",state:"width",label:"WIDTH",value:{default:1,min:.1,max:20,step:.01},meta:{unit:"Q",scale:"logarithmic",visual:"amp-knob",mapping:"higher-is-narrower"},node:"controller.width"}],sources:[{id:"source.audio",type:"audioInput"}],actions:[{id:"action.filter",type:"bandPassFilter"}],nodes:{connections:[["source.audio","action.filter"],["controller.frequency","action.filter"],["controller.width","action.filter"]]}})
})(window);
