import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const assets=path.join(repo,"app/src/main/assets");

class Style{setProperty(k,v){this[k]=v}}
class ClassList{constructor(node){this.node=node;this.set=new Set()}add(...xs){xs.forEach(x=>this.set.add(x))}contains(x){return this.set.has(x)}}
class Element{
  constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.dataset={};this.style=new Style();this.className="";this.classList=new ClassList(this);this._text=""}
  appendChild(node){node.parentElement=this;this.children.push(node);return node}
  append(...nodes){nodes.forEach(n=>this.appendChild(n))}
  set textContent(value){this._text=String(value)}
  get textContent(){return this._text}
  querySelector(selector){if(!selector.startsWith("."))return null;const cls=selector.slice(1);const visit=node=>{const names=new Set(String(node.className||"").split(/\s+/).filter(Boolean));for(const x of node.classList?.set||[])names.add(x);if(names.has(cls))return node;for(const child of node.children||[]){const found=visit(child);if(found)return found}return null};return visit(this)}
}

const document={createElement:tag=>new Element(tag)};
const context={console,document,requestAnimationFrame:fn=>fn(),window:null};
context.window=context;context.globalThis=context;
vm.createContext(context);
for(const file of ["control-surface-library.js","control-surface-spec.js","control-surface-renderer.js"]){vm.runInContext(fs.readFileSync(path.join(assets,file),"utf8"),context,{filename:file})}

const renderer=context.MultiSynth.ControlSurfaceRenderer;
function makeRotary(control,variant,value){
  const host=new Element("section");
  const node=renderer.mount(host,{id:`smoke-${control}`,control,label:"SMOKE",value,meta:{visual:{variant,valueReadout:true}}});
  const face=node.querySelector(".ms-control-face"),pointer=node.querySelector(".ms-control-pointer"),readout=node.querySelector(".ms-control-value");
  if(!face||!pointer||!readout)throw new Error(`${control} did not render face/pointer/readout`);
  if(face.style.aspectRatio!=="1 / 1")throw new Error(`${control} face is not locked circular`);
  if(node.style["--ms-width"]!==node.style["--ms-height"])throw new Error(`${control} width/height are not equal`);
  return{node,pointer,readout};
}

const knob=makeRotary("knob","cap",{default:0,min:0,max:1,step:.01});
renderer.setValue(knob.node,.75,"75%");
if(knob.readout.textContent!=="75%")throw new Error(`knob display text did not update: ${knob.readout.textContent}`);
if(!String(knob.pointer.style.transform||"").includes("rotate(67.5deg)"))throw new Error(`knob pointer did not rotate from numeric value: ${knob.pointer.style.transform||""}`);

const dial=makeRotary("dial","indexed",{default:0,min:0,max:2,step:1});
renderer.setValue(dial.node,1,"LOOP");
if(dial.readout.textContent!=="LOOP")throw new Error(`dial display text did not remain independent of numeric value: ${dial.readout.textContent}`);
if(!String(dial.pointer.style.transform||"").includes("rotate(0deg)"))throw new Error(`dial pointer did not rotate to midpoint: ${dial.pointer.style.transform||""}`);
renderer.setValue(dial.node,2,"LIVE");
if(!String(dial.pointer.style.transform||"").includes("rotate(150deg)"))throw new Error(`dial pointer did not rotate to max: ${dial.pointer.style.transform||""}`);

console.log("shared rotary contract smoke passed");
