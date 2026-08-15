"use strict";
(function(global){
const frame=document.getElementById("moduleEditorFrame");
const C=global.MultiSynth?.ModuleContract;
if(!frame||!C)return;
let cleanup=null;
function stop(){if(cleanup){try{cleanup();}catch(_){}cleanup=null;}}
function attach(){stop();let doc;try{doc=frame.contentDocument;}catch(_){return;}if(!doc)return;const url=new URL(frame.src,location.href),instance=url.searchParams.get("instance");if(!instance)return;let rt;try{rt=C.getRuntime(instance);}catch(_){return;}if(!rt?.output||!rt?.context)return;const canvas=doc.getElementById("scope")||doc.getElementById("scopeCanvas");if(!canvas)return;const ctx=rt.context,an=ctx.createAnalyser();an.fftSize=1024;try{rt.output.connect(an);}catch(_){return;}const g=canvas.getContext("2d"),data=new Uint8Array(an.fftSize);let raf=0,dead=false;
function resize(){const dpr=global.devicePixelRatio||1,w=Math.max(1,canvas.clientWidth||canvas.width||320),h=Math.max(1,canvas.clientHeight||canvas.height||100);if(canvas.width!==Math.floor(w*dpr))canvas.width=Math.floor(w*dpr);if(canvas.height!==Math.floor(h*dpr))canvas.height=Math.floor(h*dpr);}
function draw(){if(dead||!canvas.isConnected)return;resize();an.getByteTimeDomainData(data);g.fillStyle="#020607";g.fillRect(0,0,canvas.width,canvas.height);g.strokeStyle=mappedColor(rt.type);g.lineWidth=Math.max(1,(global.devicePixelRatio||1)*1.5);g.beginPath();for(let i=0;i<data.length;i++){const x=i/(data.length-1)*canvas.width,y=data[i]/255*canvas.height;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();raf=global.requestAnimationFrame(draw);}draw();cleanup=()=>{dead=true;if(raf)global.cancelAnimationFrame(raf);try{rt.output.disconnect(an);}catch(_){}try{an.disconnect();}catch(_){}};}
function mappedColor(type){return type==="randrone"?"#e5ff70":type==="hookworm"?"#e98232":type==="tapeworm"?"#fff4ef":"#e9e9e9";}
frame.addEventListener("load",()=>setTimeout(attach,0));global.addEventListener("pagehide",stop);
})(window);
