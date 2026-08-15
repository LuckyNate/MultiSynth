"use strict";
(function(global){
const frame=document.getElementById("moduleEditorFrame");
const C=global.MultiSynth?.ModuleContract;
if(!frame||!C)return;
let cleanup=null;
function stop(){if(cleanup){try{cleanup();}catch(_){}cleanup=null;}}
function mappedColor(type){return type==="randrone"?"#e5ff70":type==="hookworm"?"#e98232":type==="tapeworm"?"#fff4ef":type==="stinger"?"#ffe64a":type==="razorback"?"#ff3d42":type==="pulsynth"?"#58ff78":type==="sinladder"?"#36eaff":type==="noquarter"?"#77a4ff":type==="quadsynth"?"#ffb000":"#e9e9e9";}
function attach(){
 stop();
 let doc;try{doc=frame.contentDocument;}catch(_){return;}if(!doc)return;
 const url=new URL(frame.src,location.href),instance=url.searchParams.get("instance");if(!instance)return;
 let rt;try{rt=C.getRuntime(instance);}catch(_){return;}if(!rt?.output||!rt?.context)return;
 const canvas=doc.getElementById("scope")||doc.getElementById("scopeCanvas");if(!canvas)return;
 /* Racked editors are display/control surfaces only. Their oscilloscope must represent the live module's POST-PROCESS output, never a standalone page engine. */
 doc.documentElement.dataset.rackScope="post-process";
 try{doc.defaultView.__MULTISYNTH_RACK_SCOPE_ACTIVE__=true;}catch(_){}
 const ctx=rt.context,an=ctx.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=0;
 try{rt.output.connect(an);}catch(_){return;}
 const g=canvas.getContext("2d"),data=new Uint8Array(an.fftSize);let raf=0,dead=false;
 function resize(){const dpr=global.devicePixelRatio||1,w=Math.max(1,canvas.clientWidth||canvas.width||320),h=Math.max(1,canvas.clientHeight||canvas.height||100);const pw=Math.floor(w*dpr),ph=Math.floor(h*dpr);if(canvas.width!==pw)canvas.width=pw;if(canvas.height!==ph)canvas.height=ph;}
 function draw(){if(dead||!canvas.isConnected)return;resize();an.getByteTimeDomainData(data);const w=canvas.width,h=canvas.height;g.fillStyle="#020607";g.fillRect(0,0,w,h);g.strokeStyle=mappedColor(rt.type);g.lineWidth=Math.max(1,(global.devicePixelRatio||1)*1.5);g.beginPath();for(let i=0;i<data.length;i++){const x=i/(data.length-1)*w,y=data[i]/255*h;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();raf=global.requestAnimationFrame(draw);}
 draw();
 cleanup=()=>{dead=true;if(raf)global.cancelAnimationFrame(raf);try{rt.output.disconnect(an);}catch(_){}try{an.disconnect();}catch(_){}try{if(doc?.defaultView)doc.defaultView.__MULTISYNTH_RACK_SCOPE_ACTIVE__=false;}catch(_){}};
}
frame.addEventListener("load",()=>setTimeout(attach,0));
global.addEventListener("pagehide",stop);
})(window);
