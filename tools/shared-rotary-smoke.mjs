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
function makeRotary(control,variant,value,markerClass){
  const host=new Element("section");
  const node=renderer.mount(host,{id:`smoke-${control}`,control,label:"SMOKE",value,meta:{visual:{variant,valueReadout:true}}});
  const face=node.querySelector(".ms-control-face"),marker=node.querySelector(markerClass),readout=node.querySelector(".ms-control-value");
  if(!face||!marker||!readout)throw new Error(`${control} did not render face/marker/readout`);
  if(face.style.aspectRatio!=="1 / 1")throw new Error(`${control} face is not locked circular`);
  if(node.style["--ms-width"]!==node.style["--ms-height"])throw new Error(`${control} width/height are not equal`);
  return{node,marker,readout};
}

const knob=makeRotary("knob","cap",{default:0,min:0,max:1,step:.01},".ms-control-pointer");
renderer.setValue(knob.node,.75,"75%");
if(knob.readout.textContent!=="75%")throw new Error(`knob display text did not update: ${knob.readout.textContent}`);
if(!String(knob.marker.style.transform||"").includes("rotate(67.5deg)"))throw new Error(`knob pointer did not rotate from numeric value: ${knob.marker.style.transform||""}`);

const encoder=makeRotary("encoder","indexed",{default:0,min:0,max:2,step:1},".ms-encoder-dot");
renderer.setValue(encoder.node,1,"LOOP");
if(encoder.readout.textContent!=="LOOP")throw new Error(`encoder display text did not remain independent of numeric value: ${encoder.readout.textContent}`);
if(encoder.node.style["--ms-angle"]!=="0deg")throw new Error(`encoder dot did not rotate to midpoint: ${encoder.node.style["--ms-angle"]||""}`);
renderer.setValue(encoder.node,2,"LIVE");
if(encoder.node.style["--ms-angle"]!=="150deg")throw new Error(`encoder dot did not rotate to max: ${encoder.node.style["--ms-angle"]||""}`);

console.log("shared rotary contract smoke passed");
