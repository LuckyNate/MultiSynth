import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const assets=path.join(repo,"app/src/main/assets");
let mutationCount=0;

class Style{setProperty(k,v){this[k]=v}}
class ClassList{constructor(node){this.node=node;this.set=new Set()}add(...xs){xs.forEach(x=>this.set.add(x))}contains(x){return this.set.has(x)}}
class Element{
  constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.dataset={};this.style=new Style();this.className="";this.classList=new ClassList(this);this._text="";this._observer=null}
  appendChild(node){node.parentElement=this;this.children.push(node);return node}
  append(...nodes){nodes.forEach(n=>this.appendChild(n))}
  set textContent(value){this._text=String(value);if(this._observer){mutationCount++;if(mutationCount>8)throw new Error("rotary readout mutation loop");this._observer()}}
  get textContent(){return this._text}
  querySelector(selector){if(!selector.startsWith("."))return null;const cls=selector.slice(1);const visit=node=>{const names=new Set(String(node.className||"").split(/\s+/).filter(Boolean));for(const x of node.classList?.set||[])names.add(x);if(names.has(cls))return node;for(const child of node.children||[]){const found=visit(child);if(found)return found}return null};return visit(this)}
}
class MutationObserver{constructor(fn){this.fn=fn}observe(target){target._observer=this.fn}}

const document={createElement:tag=>new Element(tag)};
const context={console,document,MutationObserver,requestAnimationFrame:fn=>fn(),window:null};
context.window=context;context.globalThis=context;
vm.createContext(context);
for(const file of ["control-surface-library.js","control-surface-spec.js","control-surface-renderer.js"]){vm.runInContext(fs.readFileSync(path.join(assets,file),"utf8"),context,{filename:file})}

const renderer=context.MultiSynth.ControlSurfaceRenderer;
const host=new Element("section");
const knob=renderer.mount(host,{id:"smoke-knob",control:"knob",label:"SMOKE",value:{default:0,min:0,max:1,step:.01}});
const pointer=knob.querySelector(".ms-control-pointer"),readout=knob.querySelector(".ms-control-value");
if(!pointer||!readout)throw new Error("shared knob did not render pointer/readout");
renderer.setValue(knob,.75,.75);
if(readout.textContent!=="0.75")throw new Error(`readout did not update: ${readout.textContent}`);
if(!String(pointer.style.transform||"").includes("rotate(67.5deg)"))throw new Error(`pointer did not rotate from value: ${pointer.style.transform||""}`);
if(mutationCount!==1)throw new Error(`readout mutated ${mutationCount} times; expected exactly one external update`);
console.log("shared rotary mutation smoke passed");
