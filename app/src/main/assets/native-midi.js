(function () {
    "use strict";
    const held=new Set();let runningStatus=null,pendingData=[],inSysEx=false;
    function key(channel,note){return channel+":"+note} function MS(){return window.MultiSynth||{}} function clone(v){if(v==null)return v;if(typeof structuredClone==="function")return structuredClone(v);return JSON.parse(JSON.stringify(v))}
    function emitMidi(detail){const p=Object.assign({source:"usb-midi",time:MS().NodeAudioGraph?.context?.currentTime||0},detail||{});window.dispatchEvent(new CustomEvent("multisynth-midi-message",{detail:clone(p)}));return p}
    function dispatchMidi(detail){const packet=emitMidi(detail);MS().NodeAudioGraph?.midi?.(packet);return packet}
    function sendNative(status,d1,d2,length){if(!window.AndroidMidi||typeof AndroidMidi.sendMidi!=="function")return false;try{return AndroidMidi.sendMidi(status&255,(d1||0)&127,(d2||0)&127,Math.max(1,Math.min(3,length||1)))!==false}catch(_){return false}}
    function maySendClock(){return MS().PatchTransport?.external!==true}
    function sendClockPulse(){return maySendClock()?sendNative(0xf8,0,0,1):false} function sendStart(){return maySendClock()?sendNative(0xfa,0,0,1):false} function sendContinue(){return maySendClock()?sendNative(0xfb,0,0,1):false} function sendStop(){return maySendClock()?sendNative(0xfc,0,0,1):false}
    function noteOnNative(channel,note,velocity){held.add(key(channel,note));if(typeof setVisibleKey==="function")setVisibleKey(note,true);dispatchMidi({status:0x90|channel,command:0x90,channel,data1:note,data2:velocity,type:"noteOn",note,velocity})}
    function release(channel,note){held.delete(key(channel,note));if(typeof refreshVisibleKey==="function")refreshVisibleKey(note);dispatchMidi({status:0x80|channel,command:0x80,channel,data1:note,data2:0,type:"noteOff",note,velocity:0})}
    function realtime(status){const T=MS().PatchTransport;if(!T?.receiveMidi)return;const time=MS().NodeAudioGraph?.context?.currentTime??performance.now()/1000;T.receiveMidi(status,{time,source:"usb-midi"})}
    function channelMessage(status,data){
      const command=status&0xf0,channel=status&0x0f,d1=data[0]&127,d2=(data[1]||0)&127;
      if(command===0x90&&d2>0)return noteOnNative(channel,d1,d2);
      if(command===0x80||(command===0x90&&d2===0))return release(channel,d1);
      if(command===0xb0){dispatchMidi({status,command,channel,data1:d1,data2:d2,type:d1===120?"allSoundOff":d1===123?"allNotesOff":"controlChange",control:d1,value:d2});if(d1===120||d1===123)MS().NodeAudioGraph?.panic?.();return;}
      if(command===0xe0){const raw=(d2<<7)|d1;dispatchMidi({status,command,channel,data1:d1,data2:d2,type:"pitchBend",value:raw,centered:raw-8192});return;}
      if(command===0xd0){dispatchMidi({status,command,channel,data1:d1,type:"channelPressure",value:d1});return;}
      if(command===0xa0){dispatchMidi({status,command,channel,data1:d1,data2:d2,type:"polyPressure",note:d1,value:d2});return;}
      if(command===0xc0)dispatchMidi({status,command,channel,data1:d1,type:"programChange",program:d1});
    }
    function dataLength(status){const command=status&0xf0;return command===0xc0||command===0xd0?1:(command>=0x80&&command<=0xe0?2:0)}
    function process(bytes){for(const raw of bytes||[]){const byte=Number(raw)&255;if(byte>=0xf8){realtime(byte);continue}if(byte&0x80){pendingData=[];if(byte===0xf0){inSysEx=true;runningStatus=null;continue}if(byte===0xf7){inSysEx=false;runningStatus=null;continue}if(byte>=0xf1){inSysEx=false;runningStatus=null;continue}inSysEx=false;runningStatus=byte;continue}if(inSysEx||runningStatus===null)continue;pendingData.push(byte&127);const size=dataLength(runningStatus);if(!size){runningStatus=null;pendingData=[];continue}if(pendingData.length>=size){channelMessage(runningStatus,pendingData);pendingData=[]}}}
    function panicAll(){held.clear();MS().NodeAudioGraph?.panic?.();document.querySelectorAll(".key.down").forEach(k=>k.classList.remove("down"))}
    function installButton(){if(!window.AndroidMidi||document.getElementById("nativeMidiInput"))return;const controls=document.getElementById("connectionControls");if(!controls)return;const button=document.createElement("button");button.id="nativeMidiInput";button.className="btn";button.textContent="USB-C / MIDI";button.addEventListener("click",()=>{if(typeof ensureAudio==="function")ensureAudio();MS().NodeAudioGraph?.resume?.();AndroidMidi.chooseInput()});controls.appendChild(button);const audio=document.createElement("button");audio.className="btn";audio.textContent="AUDIO OUT";audio.addEventListener("click",()=>AndroidMidi.openAudioSettings());controls.appendChild(audio)}
    window.MultiSynthNativeMidi={receive:process,sendClockPulse,sendStart,sendContinue,sendStop,get usbClockActive(){return MS().PatchTransport?.external===true},devicesChanged:function(){},permissionResult:function(){},status:function(text,connected){const b=document.getElementById("nativeMidiInput");if(!b)return;b.textContent=connected?"USB-C / MIDI ON":"USB-C / MIDI";b.title=text;b.classList.toggle("active",!!connected)},panic:panicAll};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installButton);else installButton();
})();
