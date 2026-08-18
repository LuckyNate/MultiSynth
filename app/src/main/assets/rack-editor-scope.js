"use strict";
(function(global){
const frame=document.getElementById("moduleEditorFrame");
const C=global.MultiSynth?.ModuleContract;
if(!frame||!C)return;
let cleanup=null;
function stop(){if(cleanup){try{cleanup();}catch(_){}cleanup=null;}}
function attach(){
 stop();
 let doc,win;try{doc=frame.contentDocument;win=frame.contentWindow;}catch(_){return;}if(!doc||!win)return;
 const url=new URL(frame.src,location.href),instance=url.searchParams.get("instance");if(!instance)return;
 let rt;try{rt=C.getRuntime(instance);}catch(_){return;}if(!rt?.output||!rt?.context)return;
 let canvas=doc.getElementById("scope")||doc.getElementById("scopeCanvas");if(!canvas)return;
 const accent=rt.definition?.color||"#e9e9e9";
 /* Rack mode owns the visible scope. Stop the module page's standalone animation loop so
    opening editors cannot accumulate hidden 60-FPS renderers and eventually freeze WebView. */
 const oldRAF=win.requestAnimationFrame?.bind(win),oldCAF=win.cancelAnimationFrame?.bind(win);let standaloneStopped=false;
 try{win.__MULTISYNTH_RACK_SCOPE_ACTIVE__=true;win.requestAnimationFrame=function(){standaloneStopped=true;return 0;};}catch(_){}
 const fresh=canvas.cloneNode(true);canvas.replaceWith(fresh);canvas=fresh;
 doc.documentElement.dataset.rackScope="post-process";
 const ctx=rt.context,an=ctx.createAnalyser();an.fftSize=1024;an.smoothingTimeConstant=.04;try{rt.output.connect(an);}catch(_){return;}
 const g=canvas.getContext("2d"),data=new Uint8Array(an.fftSize);let raf=0,dead=false,last=0;
 function resize(){const dpr=global.devicePixelRatio||1,w=Math.max(1,canvas.clientWidth||canvas.width||320),h=Math.max(1,canvas.clientHeight||canvas.height||100);const pw=Math.floor(w*dpr),ph=Math.floor(h*dpr);if(canvas.width!==pw)canvas.width=pw;if(canvas.height!==ph)canvas.height=ph;}
 function draw(ts){if(dead||!canvas.isConnected)return;if(document.hidden){raf=global.requestAnimationFrame(draw);return;}if(ts-last<32){raf=global.requestAnimationFrame(draw);return;}last=ts;resize();an.getByteTimeDomainData(data);const w=canvas.width,h=canvas.height;g.fillStyle="#020607";g.fillRect(0,0,w,h);g.strokeStyle=accent;g.lineWidth=Math.max(1,(global.devicePixelRatio||1)*1.5);g.beginPath();for(let i=0;i<data.length;i++){const x=i/(data.length-1)*w,y=data[i]/255*h;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();raf=global.requestAnimationFrame(draw);}
 raf=global.requestAnimationFrame(draw);cleanup=()=>{dead=true;if(raf)global.cancelAnimationFrame(raf);try{rt.output.disconnect(an);}catch(_){}try{an.disconnect();}catch(_){}try{win.__MULTISYNTH_RACK_SCOPE_ACTIVE__=false;if(!standaloneStopped&&oldRAF)win.requestAnimationFrame=oldRAF;if(oldCAF)win.cancelAnimationFrame=oldCAF;}catch(_){}};
}
frame.addEventListener("load",()=>setTimeout(attach,0));global.addEventListener("pagehide",stop);
})(window);
