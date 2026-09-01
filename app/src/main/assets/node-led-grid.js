"use strict";
(function(global){
const GRID=24,PATTERN_SECONDS=30,TRANSITION_SECONDS=2.2;
const PATTERNS=["waves","rings","plasma","diagonal","vortex","sparkle"];
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
function clamp01(v){return Math.max(0,Math.min(1,v))}
function smooth(v){v=clamp01(v);return v*v*(3-2*v)}
function hash(x,y,k){const n=Math.sin(x*12.9898+y*78.233+k*37.719)*43758.5453;return n-Math.floor(n)}
function sample(name,x,y,t,w,h,index){
  const nx=w?x/w:0,ny=h?y/h:0,cx=nx-.5,cy=ny-.5,rad=Math.hypot(cx,cy),ang=Math.atan2(cy,cx);
  switch(name){
    case "rings":{
      const wave=(Math.sin(rad*44-t*3.4)+1)*.5;
      return{hue:t*24+rad*520,b:.18+.76*wave};
    }
    case "plasma":{
      const p=(Math.sin(nx*13+t*1.7)+Math.sin(ny*17-t*1.25)+Math.sin((nx+ny)*11+t*.8)+3)/6;
      return{hue:t*46+p*300,b:.2+.72*p};
    }
    case "diagonal":{
      const band=(Math.sin((nx*1.7-ny)*Math.PI*9-t*3.1)+1)*.5;
      return{hue:t*32+(nx-ny)*300,b:.16+.78*band};
    }
    case "vortex":{
      const swirl=(Math.sin(ang*5+rad*31-t*3)+1)*.5;
      return{hue:t*38+ang*57.2958+rad*440,b:.18+.74*swirl};
    }
    case "sparkle":{
      const cell=Math.floor(t*2.2),r=hash(Math.round(x/GRID),Math.round(y/GRID),cell+index*11),pulse=Math.pow(Math.max(0,1-Math.abs((t*2.2)%1-.5)*2),2);
      const sparkle=r>.82?pulse:0;
      return{hue:t*28+nx*210+ny*150+r*120,b:.2+.38*((Math.sin((x-y)*.02-t*1.3)+1)*.5)+.5*sparkle};
    }
    default:{
      const wave=(Math.sin((x+y)*.018-t*2.4)+1)*.5,ring=(Math.sin(rad*26-t*2)+1)*.5;
      return{hue:t*34+nx*210+ny*130+Math.sin((nx+ny)*Math.PI*3+t*.9)*24,b:.22+.64*(wave*.58+ring*.42)};
    }
  }
}
function mixHue(a,b,m){let d=((b-a+540)%360)-180;return a+d*m}
function patternState(t){
  const slot=Math.floor(t/PATTERN_SECONDS),local=t-slot*PATTERN_SECONDS,next=(slot+1)%PATTERNS.length,current=slot%PATTERNS.length;
  const blend=local>PATTERN_SECONDS-TRANSITION_SECONDS?smooth((local-(PATTERN_SECONDS-TRANSITION_SECONDS))/TRANSITION_SECONDS):0;
  return{current,next,blend};
}
function frame(now){
  if(!canvas||!ctx||!viewport){raf=requestAnimationFrame(frame);return;}
  const r=viewport.getBoundingClientRect(),w=r.width,h=r.height,t=(now-start)/1000,state=patternState(t);
  ctx.clearRect(0,0,w,h);
  const step=GRID*Math.max(.18,view.scale),ox=((view.x%step)+step)%step,oy=((view.y%step)+step)%step;
  const radius=Math.max(1,Math.min(3.2,1.35*Math.sqrt(Math.max(.22,view.scale))));
  for(let y=oy;y<h+step;y+=step){
    for(let x=ox;x<w+step;x+=step){
      const a=sample(PATTERNS[state.current],x,y,t,w,h,state.current),b=sample(PATTERNS[state.next],x,y,t,w,h,state.next),m=state.blend;
      const hue=m?mixHue(a.hue,b.hue,m):a.hue,brightness=a.b+(b.b-a.b)*m,light=24+brightness*42,glow=2+brightness*7;
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
