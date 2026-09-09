"use strict";
(function(){
const MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL,SPEC=MS.ControlSurfaceSpec,root=document.getElementById("test-controls");if(!R||!C||!SPEC||!root)return;
const bank=(title,count,note="")=>{const s=document.createElement("section"),h=document.createElement("div"),row=document.createElement("div");s.className="test-bank";h.className="test-bank-title";h.textContent=title;row.className=`test-row test-${count}`;s.append(h,row);if(note){const n=document.createElement("div");n.className="test-note";n.textContent=note;s.append(n)}root.appendChild(s);return row};
function fit(node,control){const face=node.querySelector(".ms-control-face"),v=SPEC.resolve(control,node.__msVisual||{});node.style.width="100%";node.style.maxWidth="none";if(!face)return;if(Number(v.size)>0){face.style.width="100%";face.style.height="auto";face.style.aspectRatio="1 / 1";return}let w=Number(v.width),h=Number(v.height);if(control===C.FADER&&node.dataset.variant==="horizontal") [w,h]=[h,w];if(control===C.RIBBON&&node.dataset.variant==="vertical") [w,h]=[h,w];if(w>0&&h>0){face.style.width="100%";face.style.height="auto";face.style.aspectRatio=`${w} / ${h}`}}
const mount=(host,control,extra={})=>{const cell=document.createElement("div");cell.className="test-cell";host.appendChild(cell);const node=R.mount(cell,{id:`test-${control}-${host.children.length}`,control,...extra});fit(node,control);return node};
let row;
row=bank("1 · TURNTABLE",1);mount(row,C.TURNTABLE,{value:{default:0,min:0,max:1,step:0}});
row=bank("2 · ENCODERS",2);for(let i=0;i<2;i++)mount(row,C.ENCODER,{value:{default:50,min:0,max:100,step:1}});
row=bank("1 · TOUCHSCREEN",1);mount(row,C.SCREEN);
row=bank("1 · OSCILLOSCOPE",1);mount(row,C.OSCILLOSCOPE);
row=bank("1 · XY",1);mount(row,C.XY,{value:{default:.5,min:0,max:1,step:.01}});
row=bank("1 · RIBBON",1);mount(row,C.RIBBON,{value:{default:.5,min:0,max:1,step:.01}});
row=bank("2 · PADS",2);for(let i=0;i<2;i++)mount(row,C.PAD);
row=bank("2 · HORIZONTAL SLIDERS",2);for(let i=0;i<2;i++)mount(row,C.FADER,{value:{default:.5,min:0,max:1,step:.01},meta:{visual:{variant:"horizontal"}}});
row=bank("4 · KNOBS",4);for(let i=0;i<4;i++)mount(row,C.KNOB,{value:{default:(i+1)/5,min:0,max:1,step:.01}});
row=bank("8 · VERTICAL FADERS",8);for(let i=0;i<8;i++)mount(row,C.FADER,{value:{default:(i+1)/9,min:0,max:1,step:.01}});
row=bank("8 · BUTTONS",8);for(let i=0;i<8;i++)mount(row,C.BUTTON);
row=bank("4 · SWITCHES",4);for(let i=0;i<4;i++){const n=mount(row,C.SWITCH);n.dataset.on=i%2?"1":"0"}
row=bank("8 · VERTICAL SWITCHES",8);for(let i=0;i<8;i++){const n=mount(row,C.SWITCH,{meta:{visual:{variant:"vertical"}}});n.dataset.on=i%2?"1":"0"}
row=bank("8 · METERS",8);for(let i=0;i<8;i++)mount(row,C.METER,{value:{default:(i+1)/9,min:0,max:1,step:.01}});
row=bank("8 · LEDS",8);for(let i=0;i<8;i++){const n=mount(row,C.LED);n.dataset.on=i%2?"1":"0"}
const tint=`hsl(${Math.floor(Math.random()*360)} 72% 58%)`;
row=bank("1 · DECAL",1);mount(row,C.DECAL,{meta:{src:"decals/skull-256.png",alt:"Skull test decal",visual:{scale:1.8,rotation:-11,tint}}});
})();
