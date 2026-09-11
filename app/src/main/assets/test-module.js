"use strict";
(function(){
const MS=window.MultiSynth||{},R=MS.ControlSurfaceRenderer,CS=MS.ControlSurface,C=CS?.CONTROL,SPEC=MS.ControlSurfaceSpec,root=document.getElementById("test-controls"),readoutRoot=document.getElementById("readout-prototypes");if(!R||!CS||!C||!SPEC||!root)return;
const randomHex=()=>`#${Math.floor(Math.random()*0x1000000).toString(16).padStart(6,"0")}`;
const randomRgba=(alpha=.45)=>{const n=Math.floor(Math.random()*0x1000000);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`};
const theme={fg:randomHex(),bg:randomHex(),edge:randomHex(),accent:randomHex(),shadow:randomRgba(),pageBg:randomHex(),pageFg:randomHex(),bankBg:randomHex(),bankEdge:randomHex(),bankTitle:randomHex(),decal:randomHex()};
const docStyle=document.documentElement.style;
docStyle.setProperty("--ms-control-fg",theme.fg);docStyle.setProperty("--ms-control-bg",theme.bg);docStyle.setProperty("--ms-control-edge",theme.edge);docStyle.setProperty("--ms-control-accent",theme.accent);docStyle.setProperty("--ms-control-shadow",theme.shadow);docStyle.setProperty("--test-page-bg",theme.pageBg);docStyle.setProperty("--test-page-fg",theme.pageFg);docStyle.setProperty("--test-bank-bg",theme.bankBg);docStyle.setProperty("--test-bank-edge",theme.bankEdge);docStyle.setProperty("--test-bank-title",theme.bankTitle);docStyle.setProperty("--test-decal",theme.decal);
if(readoutRoot){const add=(text,columns,lit=false,word=false)=>{const box=document.createElement("div");box.className="readout-prototype"+(word?" word":"");readoutRoot.appendChild(box);CS.mountReadout(box,{control:C.READOUT,meta:{rows:1,columns,text,lit}})};add("1",1,false);add("02",2,true);add("003",3,false);add("MultiSynth",10,true,true);add("Welcome to MultiSynth, the node based modular synth for Android!",12,false,true)}
const bank=(title,count,note="")=>{const s=document.createElement("section"),h=document.createElement("div"),row=document.createElement("div");s.className="test-bank";h.className="test-bank-title";h.textContent=title;row.className=`test-row test-${count}`;s.append(h,row);if(note){const n=document.createElement("div");n.className="test-note";n.textContent=note;s.append(n)}root.appendChild(s);return row};
function fit(node,control){const face=node.querySelector(".ms-control-face"),v=SPEC.resolve(control,node.__msVisual||{});node.style.width="100%";node.style.maxWidth="none";if(!face)return;if(Number(v.size)>0){face.style.width="100%";face.style.height="auto";face.style.aspectRatio="1 / 1";return}let w=Number(v.width),h=Number(v.height);if(control===C.FADER&&node.dataset.variant==="horizontal") [w,h]=[h,w];if((control===C.RIBBON||control===C.EXPRESSION)&&node.dataset.variant==="vertical") [w,h]=[h,w];if(w>0&&h>0){face.style.width="100%";face.style.height="auto";face.style.aspectRatio=`${w} / ${h}`}}
const mount=(host,control,extra={})=>{const cell=document.createElement("div");cell.className="test-cell";host.appendChild(cell);const node=R.mount(cell,{id:`test-${control}-${host.children.length}`,control,...extra},{freewheel:true});fit(node,control);return node};
let row;
row=bank("1 · TURNTABLE",1);mount(row,C.TURNTABLE,{value:{default:0,min:0,max:1,step:0}});
row=bank("2 · ENCODERS",2);for(let i=0;i<2;i++)mount(row,C.ENCODER,{value:{default:50,min:0,max:100,step:1}});
row=bank("1 · TOUCHSCREEN",1);mount(row,C.SCREEN);
row=bank("1 · OSCILLOSCOPE",1);mount(row,C.OSCILLOSCOPE);
row=bank("1 · XY",1);mount(row,C.XY);
row=bank("1 · RIBBON",1);mount(row,C.RIBBON,{value:{default:0,min:-1,max:1,step:.01}});
row=bank("1 · EXPRESSION",1);mount(row,C.EXPRESSION,{value:{default:0,min:-1,max:1,step:.01}});
row=bank("3 · PADS",3);mount(row,C.PAD,{variant:"square"});mount(row,C.PAD,{variant:"round"});mount(row,C.PAD,{variant:"hex"});
row=bank("2 · HORIZONTAL SLIDERS",2);for(let i=0;i<2;i++)mount(row,C.FADER,{value:{default:.5,min:0,max:1,step:.01},meta:{visual:{variant:"horizontal"}}});
row=bank("4 · KNOBS",4);for(let i=0;i<4;i++)mount(row,C.KNOB,{value:{default:(i+1)/5,min:0,max:1,step:.01}});
row=bank("8 · VERTICAL FADERS",8);for(let i=0;i<8;i++)mount(row,C.FADER,{value:{default:(i+1)/9,min:0,max:1,step:.01}});
row=bank("3 · BUTTONS",3);mount(row,C.BUTTON,{variant:"rect"});mount(row,C.BUTTON,{variant:"round"});mount(row,C.BUTTON,{variant:"arcade"});
row=bank("4 · SWITCHES",4);for(let i=0;i<4;i++){const n=mount(row,C.SWITCH);n.dataset.on=i%2?"1":"0"}
row=bank("8 · VERTICAL SWITCHES",8);for(let i=0;i<8;i++){const n=mount(row,C.SWITCH,{meta:{visual:{variant:"vertical"}}});n.dataset.on=i%2?"1":"0"}
row=bank("8 · METERS",8);for(let i=0;i<8;i++)mount(row,C.METER,{value:{default:(i+1)/9,min:0,max:1,step:.01}});
row=bank("8 · LEDS",8);for(let i=0;i<8;i++){const n=mount(row,C.LED);n.dataset.on=i%2?"1":"0"}
row=bank("1 · DECAL",1);mount(row,C.DECAL,{meta:{src:"decals/skull-256.png",alt:"Skull test decal",visual:{scale:1.8,rotation:-11,tint:theme.decal}}});
})();
