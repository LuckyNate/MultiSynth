"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},instances=new Map();
const clone=v=>{try{return typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v))}catch(_){return v}};
function graph(){return MS.RackEngine?.graph?.()||{racks:[],edges:[]}}
function position(instanceId){for(const r of graph().racks){const i=(r.modules||[]).findIndex(m=>m.id===instanceId);if(i>=0)return{rack:r,index:i,row:r.row,col:r.col}}return null}
function isAbove(parentId,childId){if(parentId===childId)return false;const g=graph(),A=position(parentId),B=position(childId);if(!A||!B)return false;if(A.rack.id===B.rack.id)return A.index<B.index;const seen=new Set([A.rack.id]),q=[A.rack.id];while(q.length){const x=q.shift();for(const e of g.edges||[])if(e.from===x&&!seen.has(e.to)){if(e.to===B.rack.id)return true;seen.add(e.to);q.push(e.to)}}return false}
function makeTxId(instanceId){let s=String(instanceId||"").replace(/[^a-z0-9]/gi,"").toUpperCase();return"TX-"+(s.slice(-5)||Math.random().toString(36).slice(2,7).toUpperCase())}
function uniqueTxId(wanted,instanceId){let id=String(wanted||"").trim().toUpperCase()||makeTxId(instanceId),base=id,n=2;while([...instances.values()].some(x=>x.id!==instanceId&&x.txId===id))id=base+"-"+n++;return id}
function register(instanceId,options={},hooks={}){unregister(instanceId);const rec={id:instanceId,txId:uniqueTxId(options.txId,instanceId),parentTxIds:Array.isArray(options.parentTxIds)?options.parentTxIds.map(String):[],hooks};instances.set(instanceId,rec);return describe(instanceId)}
function unregister(instanceId){return instances.delete(instanceId)}
function update(instanceId,options={}){const r=instances.get(instanceId);if(!r)return register(instanceId,options);if("txId" in options)r.txId=uniqueTxId(options.txId,instanceId);if("parentTxIds" in options)r.parentTxIds=Array.isArray(options.parentTxIds)?options.parentTxIds.map(String):[];return describe(instanceId)}
function availableParents(instanceId){return[...instances.values()].filter(x=>x.id!==instanceId&&isAbove(x.id,instanceId)).map(x=>({instanceId:x.id,txId:x.txId,position:position(x.id)}))}
function selectedParents(instanceId){const r=instances.get(instanceId);if(!r)return[];const allowed=new Set(availableParents(instanceId).map(x=>x.txId));return r.parentTxIds.filter(x=>allowed.has(x))}
function childrenOfTx(txId){const tx=[...instances.values()].find(x=>x.txId===txId);if(!tx)return[];return[...instances.values()].filter(r=>r.id!==tx.id&&isAbove(tx.id,r.id)&&selectedParents(r.id).includes(txId)).map(r=>r.id)}
function send(instanceId,kind,payload){const tx=instances.get(instanceId);if(!tx)return 0;let n=0;for(const id of childrenOfTx(tx.txId)){try{instances.get(id)?.hooks?.receive?.(String(kind),clone(payload),tx.txId,instanceId);n++}catch(e){console.error("TXRXR receive",e)}}return n}
function describe(instanceId){const r=instances.get(instanceId);if(!r)return null;return{id:r.id,txId:r.txId,parentTxIds:selectedParents(instanceId),availableParents:availableParents(instanceId),wirelessChildren:childrenOfTx(r.txId),position:position(instanceId),mode:selectedParents(instanceId).length?"rx+tx":"tx"}}
MS.TXRXRBus=Object.freeze({register,unregister,update,send,describe,position,isAbove,availableParents,selectedParents,childrenOfTx,all:()=>[...instances.keys()].map(describe)});
})(window);
