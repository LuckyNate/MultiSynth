"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},KEY="multisynth.racks.v1",clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||"null");return d&&Array.isArray(d.racks)?d:{version:1,racks:[]}}catch(_){return{version:1,racks:[]}}}
function save(d){localStorage.setItem(KEY,JSON.stringify({version:1,racks:Array.isArray(d?.racks)?d.racks:[]}));return d}
function list(){return clone(load().racks)}
function get(id){return clone(load().racks.find(x=>String(x.id)===String(id))||null)}
function registerRack(id,name){const d=load();id=String(id);let r=d.racks.find(x=>String(x.id)===id);if(!r){r={id,name:String(name||`Rack ${d.racks.length+1}`)};d.racks.push(r)}else if(name)r.name=String(name);save(d);return clone(r)}
function rename(id,name){const d=load(),r=d.racks.find(x=>String(x.id)===String(id));if(!r)return false;r.name=String(name||r.name);save(d);return clone(r)}
function remove(id){const d=load(),n=d.racks.length;d.racks=d.racks.filter(x=>String(x.id)!==String(id));if(d.racks.length===n)return false;save(d);return true}
MS.RackLibrary=Object.freeze({load,list,get,registerRack,rename,remove});
})(window);
