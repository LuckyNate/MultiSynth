"use strict";
(function(){
const armed=document.getElementById("armed"),sink=document.getElementById("sinkId"),route=document.getElementById("routeButton"),phone=document.getElementById("phoneButton"),status=document.getElementById("status"),lamp=document.getElementById("lamp");
function emit(el){el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}
function paint(){const on=!!armed.checked;document.body.classList.toggle("armed",on);lamp.classList.toggle("on",on);route.textContent=on?"CAR OUT ARMED":"ARM CAR OUT";status.textContent=on?"EXTERNAL OUTPUT ARMED · EXPLICIT ROUTE":"PHONE OUTPUT · CAR BLOCKED";}
route.addEventListener("click",async()=>{let id="system";try{if(navigator.mediaDevices?.selectAudioOutput){const d=await navigator.mediaDevices.selectAudioOutput();if(d?.deviceId)id=d.deviceId;}}catch(e){status.textContent="OUTPUT SELECTION CANCELLED";return;}sink.value=id;armed.checked=true;emit(sink);emit(armed);paint();});
phone.addEventListener("click",()=>{armed.checked=false;sink.value="";emit(sink);emit(armed);paint();});
armed.addEventListener("change",paint);paint();
})();