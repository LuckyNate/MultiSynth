"use strict";
(function(){
const MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,C=MS.ControlSurface?.CONTROL,SPEC=MS.ControlSurfaceSpec,root=document.getElementById("test-controls");if(!R||!C||!SPEC||!root)return;
const bank=(title,count,note="")=>{const s=document.createElement("section"),h=document.createElement("div"),row=document.createElement("div");s.className="test-bank";h.className="test-bank-title";h.textContent=title;row.className=`test-row test-${count}`;s.append(h,row);if(note){const n=document.createElement("div");n.className="test-note";n.textContent=note;s.append(n)}root.appendChild(s);return row};
function fit(node,control){const face=node.querySelector(".ms-control-face"),v=SPEC.resolve(control,node.__msVisual||{});node.style.width="100%";node.style.maxWidth="none";if(!face)return;if(Number(v.size)>0){face.style.width="100%";face.style.height="auto";face.style.aspectRatio="1 / 1";return}let w=Number(v.width),h=Number(v.height);if(control===C.FADER&&node.dataset.variant==="horizontal") [w,h]=[h,w];if(control===C.RIBBON&&node.dataset.variant==="vertical") [w,h]=[h,w];if(w>0&&h>0){face.style.width="100%";face.style.height="auto";face.style.aspectRatio=`${w} / ${h}`}}
const mount=(host,control,label,extra={})=>{const cell=document.createElement("div");cell.className="test-cell";host.appendChild(cell);const node=R.mount(cell,{id:`test-${control}-${host.children.length}`,control,label,...extra});fit(node,control);return node};
let row;
row=bank("1 · TURNTABLE",1);mount(row,C.TURNTABLE,"TURNTABLE",{value:{default:0,min:0,max:1,step:0}});
row=bank("1 · DIAL / ENCODER CANDIDATE",1,"Current library name is DIAL; this is the form we are evaluating as ENCODER.");mount(row,C.DIAL,"DIAL",{value:{default:50,min:0,max:100,step:1}});
row=bank("1 · TOUCHSCREEN",1);mount(row,C.SCREEN,"SCREEN");
row=bank("1 · OSCILLOSCOPE",1);mount(row,C.OSCILLOSCOPE,"OSCILLOSCOPE");
row=bank("1 · XY",1);mount(row,C.XY,"XY",{value:{default:.5,min:0,max:1,step:.01}});
row=bank("1 · RIBBON",1);mount(row,C.RIBBON,"RIBBON",{value:{default:.5,min:0,max:1,step:.01}});
row=bank("2 · PADS",2);for(let i=0;i<2;i++)mount(row,C.PAD,`PAD ${i+1}`);
row=bank("2 · HORIZONTAL SLIDERS",2);for(let i=0;i<2;i++)mount(row,C.FADER,`SLIDER ${i+1}`,{value:{default:.5,min:0,max:1,step:.01},meta:{visual:{variant:"horizontal"}}});
row=bank("4 · KNOBS",4);for(let i=0;i<4;i++)mount(row,C.KNOB,`KNOB ${i+1}`,{value:{default:(i+1)/5,min:0,max:1,step:.01}});
row=bank("8 · VERTICAL FADERS",8);for(let i=0;i<8;i++)mount(row,C.FADER,`${i+1}`,{value:{default:(i+1)/9,min:0,max:1,step:.01}});
row=bank("8 · BUTTONS",8);for(let i=0;i<8;i++)mount(row,C.BUTTON,`${i+1}`);
row=bank("8 · SWITCHES",8);for(let i=0;i<8;i++)mount(row,C.SWITCH,`${i+1}`);
row=bank("8 · METERS",8);for(let i=0;i<8;i++)mount(row,C.METER,`${i+1}`,{value:{default:(i+1)/9,min:0,max:1,step:.01}});
row=bank("8 · LEDS",8);for(let i=0;i<8;i++){const n=mount(row,C.LED,`${i+1}`);n.dataset.on=i%2?"1":"0"}
row=bank("1 · DECAL",1);mount(row,C.DECAL,"DECAL",{meta:{src:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='180' viewBox='0 0 360 180'%3E%3Crect width='360' height='180' fill='%23202020'/%3E%3Ctext x='180' y='98' text-anchor='middle' fill='%23d8d8d8' font-family='sans-serif' font-size='28' font-weight='700'%3EDECAL%3C/text%3E%3C/svg%3E",alt:"Test decal"}});
})();
