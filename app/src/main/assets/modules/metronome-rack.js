"use strict";
(function(global){
const C=global.MultiSynth?.ModuleContract;if(!C)return;
function defaults(){return{bpm:120,swing:0,running:false,cvTrigger:false}}
function create(api){const c=api.context,input=c.createGain(),output=c.createGain();input.connect(output);api.setInput(input);api.setOutput(output);return{ctx:c,input,output,state:api.state}}
function fatherTick(runtime,state,tick,external){
    const u=runtime.user;if(!u)return false;
    const detail={instanceId:runtime.instanceId,time:Number(tick?.time)||u.ctx.currentTime,substep:Number(tick?.substep)||0,beat:Number(tick?.beat)||0,bpm:Number(tick?.bpm)||Number(state.bpm)||120,cvTrigger:state.cvTrigger===true,external:external===true,source:external?"usb-c":runtime.instanceId};
    global.dispatchEvent(new CustomEvent("multisynth-father-time-tick",{detail}));
    return true;
}
function clockTick({runtime,state},tick){
    const u=runtime.user;if(!u||state.running===false)return false;
    global.MultiSynthNativeMidi?.sendClock16th?.(Number(tick?.bpm)||Number(state.bpm)||120,Number(tick?.substep)||0);
    if((tick.substep||0)%4!==0)return true;
    fatherTick(runtime,state,tick,false);
    if(state.cvTrigger===true){
        global.MultiSynth?.RackAudioGraph?.sendCV?.(runtime.instanceId,{kind:"trigger",value:1,gate:true,bpm:tick.bpm,swing:Number(state.swing)||0,substep:tick.substep,beat:tick.beat,time:tick.time});
        global.dispatchEvent(new CustomEvent("multisynth-father-time-cv-trigger",{detail:{instanceId:runtime.instanceId,time:tick.time,substep:tick.substep,beat:tick.beat,bpm:tick.bpm}}));
    }
    return true;
}
function cv({runtime,state},packet={}){
    if(packet?.source!=="usb-c")return packet;
    if(packet.kind==="transport"){
        if(packet.action==="start")global.dispatchEvent(new CustomEvent("multisynth-father-time-external-start",{detail:{instanceId:runtime.instanceId,bpm:Number(packet.bpm)||Number(state.bpm)||120}}));
        if(packet.action==="stop")global.dispatchEvent(new CustomEvent("multisynth-father-time-external-stop",{detail:{instanceId:runtime.instanceId,bpm:Number(packet.bpm)||Number(state.bpm)||120}}));
        return packet;
    }
    if(packet.clock===true&&packet.kind==="trigger"){
        const bpm=Number(packet.bpm)||Number(state.bpm)||120;
        state.bpm=bpm;
        if(runtime.user)runtime.user.state=state;
        fatherTick(runtime,state,{time:packet.time,bpm,substep:(Number(packet.quarter)||0)*4,beat:Number(packet.quarter)||0},true);
    }
    return packet;
}
function setState({runtime,state,patch}){
    if(runtime.user)runtime.user.state=state;
    if(patch&&Object.prototype.hasOwnProperty.call(patch,"running")){
        if(state.running===true)global.MultiSynthNativeMidi?.sendStart?.();
        else global.MultiSynthNativeMidi?.sendStop?.();
    }
}
function destroy({runtime}){for(const n of [runtime.user?.input,runtime.user?.output])try{n?.disconnect()}catch(_){}}
C.define({type:"metronome",displayName:"Father Time",category:"clock",version:"rack-clock-11",editorUrl:"rack-module-editor.html",color:"#8d6b45",selectorClass:"metronome",description:"SILENT 4/4 MASTER CLOCK · BPM · SWING · USB-C CV MASTER/SLAVE",defaults:defaults(),resources:["midi","storage"],create,setState,clockTick,cv,destroy,serialize:({state})=>({...state}),restore:({saved})=>Object.assign(defaults(),saved||{})})
})(window);