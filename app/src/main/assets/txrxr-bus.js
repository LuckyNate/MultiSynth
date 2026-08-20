"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},links=new Map(),instances=new Map();
const clone=v=>{try{return typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v))}catch(_){return v}};
function graph(){return MS.RackEngine?.graph?.()||{racks:[],edges:[]}}
function position(instanceId){for(const r of graph().racks){const i=(r.modules||[]).findIndex(m=>m.id===instanceId);if(i>=0)return{rack:r,index:i,row:r.row,col:r.col}}return null}
function senior(a,b){const A=position(a),B=position(b);if(!A||!B)return String(a)<String(b)?a:b;if(A.row!==B.row)return A.row<B.row?a:b;if(A.col!==B.col)return A.col<B.col?a:b;if(A.rack.id===B.rack.id&&A.index!==B.index)return A.index<B.index?a:b;return String(a)<String(b)?a:b}
function bucket(linkId){const k=String(linkId||"A");if(!links.has(k))links.set(k,new Set());return links.get(k)}
function peers(instanceId){const me=instances.get(instanceId);if(!me)return[];return[...bucket(me.linkId)].filter(id=>id!==instanceId&&instances.has(id))}
function role(instanceId){const ps=peers(instanceId);if(!ps.length)return"standby";const mate=ps.sort((a,b)=>{const A=position(a),B=position(b);return(A?.row??9999)-(B?.row??9999)||(A?.col??9999)-(B?.col??9999)||(A?.index??9999)-(B?.index??9999)||String(a).localeCompare(String(b))})[0];return senior(instanceId,mate)===instanceId?"tx":"rx"}
function register(instanceId,linkId="A",hooks={}){unregister(instanceId);const rec={id:instanceId,linkId:String(linkId||"A"),hooks};instances.set(instanceId,rec);bucket(rec.linkId).add(instanceId);return rec}
function unregister(instanceId){const rec=instances.get(instanceId);if(!rec)return false;links.get(rec.linkId)?.delete(instanceId);if(links.get(rec.linkId)?.size===0)links.delete(rec.linkId);instances.delete(instanceId);return true}
function relink(instanceId,linkId){const rec=instances.get(instanceId);if(!rec)return register(instanceId,linkId);return register(instanceId,linkId,rec.hooks)}
function send(instanceId,kind,payload){if(role(instanceId)!=="tx")return 0;let n=0;for(const id of peers(instanceId))if(role(id)==="rx"){try{instances.get(id)?.hooks?.receive?.(String(kind),clone(payload),instanceId);n++}catch(e){console.error("TXRXR receive",e)}}return n}
function describe(instanceId){const rec=instances.get(instanceId);return rec?{id:rec.id,linkId:rec.linkId,role:role(instanceId),peers:peers(instanceId)}:null}
MS.TXRXRBus=Object.freeze({register,unregister,relink,send,role,describe,position,all:()=>[...instances.keys()].map(describe)});
})(window);
