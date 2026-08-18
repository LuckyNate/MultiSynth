"use strict";
(function(){
const armed=document.getElementById("armed"),sink=document.getElementById("sinkId"),route=document.getElementById("routeButton"),phone=document.getElementById("phoneButton"),status=document.getElementById("status"),lamp=document.getElementById("lamp"),normalize=document.getElementById("normalize"),tailLift=document.getElementById("tailLift"),tailLiftValue=document.getElementById("tailLiftValue");
function emit(el){el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}
function paint(){const on=!!armed.checked;document.body.classList.toggle("armed",on);lamp.classList.toggle("on",on);route.textContent=on?"CAR OUT ARMED":"ARM CAR OUT";status.textContent=on?"EXTERNAL OUTPUT ARMED · EXPLICIT ROUTE":"PHONE OUTPUT · CAR BLOCKED";tailLiftValue.textContent=`${tailLift.value}%`;}
route.addEventListener("click",async()=>{let id="system";try{if(navigator.mediaDevices?.selectAudioOutput){const d=await navigator.mediaDevices.selectAudioOutput();if(d?.deviceId)id=d.deviceId;}}catch(e){status.textContent="OUTPUT SELECTION CANCELLED";return;}sink.value=id;armed.checked=true;emit(sink);emit(armed);paint();});
phone.addEventListener("click",()=>{armed.checked=false;sink.value="";emit(sink);emit(armed);paint();});
normalize.addEventListener("change",()=>{emit(normalize);paint();});
tailLift.addEventListener("input",()=>{tailLiftValue.textContent=`${tailLift.value}%`;emit(tailLift);});
armed.addEventListener("change",paint);paint();
})();