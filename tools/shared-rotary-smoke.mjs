import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const assets=path.join(repo,"app/src/main/assets");

class Style{setProperty(k,v){this[k]=v}}
class ClassList{constructor(node){this.node=node;this.set=new Set()}add(...xs){xs.forEach(x=>this.set.add(x))}contains(x){return this.set.has(x)}}
class MockEvent{
  constructor(type,init={}){this.type=type;Object.assign(this,init);this.defaultPrevented=false;this.__stopped=false;this.__immediateStopped=false}
  preventDefault(){this.defaultPrevented=true}
  stopPropagation(){this.__stopped=true}
  stopImmediatePropagation(){this.__stopped=true;this.__immediateStopped=true}
}
class MockCustomEvent extends MockEvent{constructor(type,init={}){super(type,init);this.detail=init.detail}}
class MockMouseEvent extends MockEvent{}
class Element{
  constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.dataset={};this.style=new Style();this.className="";this.classList=new ClassList(this);this._text="";this._listeners=new Map()}
  appendChild(node){node.parentElement=this;this.children.push(node);return node}
  append(...nodes){nodes.forEach(n=>this.appendChild(n))}
  set textContent(value){this._text=String(value)}
  get textContent(){return this._text}
  addEventListener(type,fn,options){const list=this._listeners.get(type)||[];list.push({fn,capture:options===true||!!options?.capture});this._listeners.set(type,list)}
  dispatchEvent(event){if(!event?.type)throw new Error("event type required");if(!event.target)event.target=this;const path=[];for(let n=this;n;n=n.parentElement)path.push(n);for(let i=path.length-1;i>=0&&!event.__stopped;i--){for(const l of path[i]._listeners?.get(event.type)||[]){if(!l.capture)continue;l.fn.call(path[i],event);if(event.__immediateStopped)break}}for(let i=0;i<path.length&&!event.__stopped;i++){for(const l of path[i]._listeners?.get(event.type)||[]){if(l.capture)continue;l.fn.call(path[i],event);if(event.__immediateStopped)break}}return !event.defaultPrevented}
  querySelector(selector){if(!selector.startsWith("."))return null;const cls=selector.slice(1);const visit=node=>{const names=new Set(String(node.className||"").split(/\s+/).filter(Boolean));for(const x of node.classList?.set||[])names.add(x);if(names.has(cls))return node;for(const child of node.children||[]){const found=visit(child);if(found)return found}return null};return visit(this)}
  getBoundingClientRect(){return{left:0,top:0,width:100,height:100,right:100,bottom:100}}
}

const document={createElement:tag=>new Element(tag)};
const context={console,document,requestAnimationFrame:fn=>fn(),window:null,CustomEvent:MockCustomEvent,MouseEvent:MockMouseEvent,performance:{now:()=>Date.now()}};
context.window=context;context.globalThis=context;
vm.createContext(context);
for(const file of ["control-surface-library.js","control-surface-spec.js","control-surface-renderer.js"]){vm.runInContext(fs.readFileSync(path.join(assets,file),"utf8"),context,{filename:file})}

const renderer=context.MultiSynth.ControlSurfaceRenderer;
function makeRotary(control,variant,value,markerClass){
  const host=new Element("section");
  const node=renderer.mount(host,{id:`smoke-${control}`,control,label:"SMOKE",value,meta:{visual:{variant,valueReadout:true}}});
  const face=node.querySelector(".ms-control-face"),marker=node.querySelector(markerClass),readout=node.querySelector(".ms-control-value");
  if(!face||!marker||!readout)throw new Error(`${control} did not render face/marker/readout`);
  if(face.style.aspectRatio!=="1 / 1")throw new Error(`${control} face is not locked circular`);
  if(node.style["--ms-width"]!==node.style["--ms-height"])throw new Error(`${control} width/height are not equal`);
  return{node,marker,readout};
}
function pointer(type,id=1,x=10,y=10){return new MockEvent(type,{pointerId:id,clientX:x,clientY:y,button:0,bubbles:true,cancelable:true})}

const knob=makeRotary("knob","cap",{default:0,min:0,max:1,step:.01},".ms-control-pointer");
renderer.setValue(knob.node,.75,"75%");
if(knob.readout.textContent!=="75%")throw new Error(`knob display text did not update: ${knob.readout.textContent}`);
if(!String(knob.marker.style.transform||"").includes("rotate(67.5deg)"))throw new Error(`knob pointer did not rotate from numeric value: ${knob.marker.style.transform||""}`);
let knobLockEvents=0;
knob.node.addEventListener("multisynth-control-lock-change",e=>{knobLockEvents++;if(e.detail?.locked!==true)throw new Error("knob tap did not report locked state")});
knob.node.dispatchEvent(pointer("pointerdown",1,10,10));
knob.node.dispatchEvent(pointer("pointerup",1,10,10));
if(knob.node.dataset.locked!=="1"||knob.node.isControlLocked?.()!==true)throw new Error("knob tap did not lock control");
if(knobLockEvents!==1)throw new Error(`knob lock event count wrong: ${knobLockEvents}`);

const encoder=makeRotary("encoder","indexed",{default:0,min:0,max:2,step:1},".ms-encoder-dot");
renderer.setValue(encoder.node,1,"LOOP");
if(encoder.readout.textContent!=="LOOP")throw new Error(`encoder display text did not remain independent of numeric value: ${encoder.readout.textContent}`);
if(encoder.node.style["--ms-angle"]!=="0deg")throw new Error(`encoder dot did not rotate to midpoint: ${encoder.node.style["--ms-angle"]||""}`);
renderer.setValue(encoder.node,2,"LIVE");
if(encoder.node.style["--ms-angle"]!=="150deg")throw new Error(`encoder dot did not rotate to max: ${encoder.node.style["--ms-angle"]||""}`);
let encoderTaps=0,encoderClicks=0;
encoder.node.addEventListener("multisynth-control-tap",()=>encoderTaps++);
encoder.node.addEventListener("click",()=>encoderClicks++);
encoder.node.dispatchEvent(pointer("pointerdown",2,20,20));
encoder.node.dispatchEvent(pointer("pointerup",2,20,20));
if(encoderTaps!==1)throw new Error(`encoder tap event count wrong: ${encoderTaps}`);
if(encoderClicks!==1)throw new Error(`encoder click event count wrong: ${encoderClicks}`);

if(!context.MultiSynth.ControlSurface.isDefaultGesture("encoder","circularDrag"))throw new Error("encoder circularDrag is not a default shared gesture");
let dragEvents=0,lastDrag=null;
encoder.node.addEventListener("multisynth-control-circular-drag",e=>{dragEvents++;lastDrag=e.detail});
encoder.node.dispatchEvent(pointer("pointerdown",3,100,50));
encoder.node.dispatchEvent(pointer("pointermove",3,50,100));
encoder.node.dispatchEvent(pointer("pointermove",3,0,50));
encoder.node.dispatchEvent(pointer("pointermove",3,50,0));
encoder.node.dispatchEvent(pointer("pointermove",3,100,50));
encoder.node.dispatchEvent(pointer("pointermove",3,50,100));
encoder.node.dispatchEvent(pointer("pointermove",3,0,50));
encoder.node.dispatchEvent(pointer("pointermove",3,50,0));
encoder.node.dispatchEvent(pointer("pointermove",3,100,50));
encoder.node.dispatchEvent(pointer("pointermove",3,50,100));
encoder.node.dispatchEvent(pointer("pointerup",3,50,100));
if(dragEvents<10)throw new Error(`encoder circular drag emitted too few events: ${dragEvents}`);
if(Math.abs(Number(lastDrag?.rotationDegrees)-900)>1e-6)throw new Error(`encoder circular drag did not accumulate unlimited rotation: ${lastDrag?.rotationDegrees}`);
if(encoder.node.style["--ms-angle"]!=="900deg")throw new Error(`encoder indicator did not follow unbounded circular rotation: ${encoder.node.style["--ms-angle"]}`);
if(encoderTaps!==1||encoderClicks!==1)throw new Error("encoder circular drag incorrectly fired tap/click");

console.log("shared rotary contract smoke passed");
