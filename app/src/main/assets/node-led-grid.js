"use strict";
(function(global){
const GRID=24;
let viewport=null,canvas=null,ctx=null,view={x:0,y:0,scale:1},raf=0,start=performance.now();
function ensure(){
  if(canvas)return true;
  viewport=document.getElementById("nodeViewport");
  if(!viewport)return false;
  canvas=document.createElement("canvas");
  canvas.className="nodeLedGrid";
  canvas.setAttribute("aria-hidden","true");
  viewport.prepend(canvas);
  ctx=canvas.getContext("2d");
  resize();
  addEventListener("resize",resize,{passive:true});
  raf=requestAnimationFrame(frame);
  return true;
}
function resize(){
  if(!viewport||!canvas||!ctx)return;
  const r=viewport.getBoundingClientRect(),dpr=Math.max(1,global.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(r.width*dpr));
  canvas.height=Math.max(1,Math.round(r.height*dpr));
  canvas.style.width=r.width+"px";
  canvas.style.height=r.height+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function hueAt(x,y,t,w,h){
  const nx=w?x/w:0,ny=h?y/h:0;
  return (t*34+nx*210+ny*130+Math.sin((nx+ny)*Math.PI*3+t*.9)*24)%360;
}
function brightnessAt(x,y,t,w,h){
  const dx=x-w*.5,dy=y-h*.5,rad=Math.hypot(dx,dy)/Math.max(1,Math.hypot(w*.5,h*.5));
  const wave=(Math.sin((x+y)*.018-t*2.4)+1)*.5;
  const ring=(Math.sin(rad*13-t*2)+1)*.5;
  return .22+.64*(wave*.58+ring*.42);
}
function frame(now){
  if(!canvas||!ctx||!viewport){raf=requestAnimationFrame(frame);return;}
  const r=viewport.getBoundingClientRect(),w=r.width,h=r.height,t=(now-start)/1000;
  ctx.clearRect(0,0,w,h);
  const step=GRID*Math.max(.18,view.scale),ox=((view.x%step)+step)%step,oy=((view.y%step)+step)%step;
  const radius=Math.max(1,Math.min(3.2,1.35*Math.sqrt(Math.max(.22,view.scale))));
  for(let y=oy;y<h+step;y+=step){
    for(let x=ox;x<w+step;x+=step){
      const hue=hueAt(x,y,t,w,h),b=brightnessAt(x,y,t,w,h),light=24+b*42,glow=2+b*7;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);
      ctx.fillStyle=`hsl(${hue} 92% ${light}%)`;
      ctx.shadowColor=`hsl(${hue} 100% 62%)`;ctx.shadowBlur=glow;ctx.fill();
    }
  }
  ctx.shadowBlur=0;
  raf=requestAnimationFrame(frame);
}
function setView(next){view={x:Number(next?.x)||0,y:Number(next?.y)||0,scale:Math.max(.18,Number(next?.scale)||1)};ensure()}
function destroy(){if(raf)cancelAnimationFrame(raf);raf=0;canvas?.remove();canvas=null;ctx=null;viewport=null}
global.MultiSynth=global.MultiSynth||{};
global.MultiSynth.NodeLedGrid=Object.freeze({setView,resize,destroy});
ensure();
})(window);
