"use strict";
(function(global){
const MS=global.MultiSynth=global.MultiSynth||{},PCM=MS.RawPCMLibrary||MS.PCMLibrary,DB_NAME="multisynth-grain-library",DB_VERSION=1,STORE="grains";let dbp=null;
const folderDefs=new Map([
 ["mic",{id:"mic",label:"MIC SAMPLES",order:10}],
 ["rack",{id:"rack",label:"RACK SAMPLES",order:20}],
 ["grains",{id:"grains",label:"GRAIN SAMPLES",order:30}],
 ["processed",{id:"processed",label:"PROCESSED SAMPLES",order:40}],
 ["imported",{id:"imported",label:"IMPORTED SAMPLES",order:50}],
 ["other",{id:"other",label:"OTHER SAMPLES",order:999}]
]);
function safeFolder(id){id=String(id||"").toLowerCase();return folderDefs.has(id)?id:"other"}
function registerFolder(def){const id=String(def?.id||"").toLowerCase().replace(/[^a-z0-9_-]/g,"");if(!id||id==="root"||id==="..")throw new Error("Invalid sample folder");folderDefs.set(id,{id,label:String(def?.label||id.toUpperCase()),order:Number(def?.order)||500});return id}
function classify(rec){if(rec?.folder&&folderDefs.has(String(rec.folder)))return String(rec.folder);if(rec?.library==="grain"||String(rec?.id||"").startsWith("grain-"))return"grains";const s=(String(rec?.source||"")+" "+(rec?.tags||[]).join(" ")).toLowerCase();if(s.includes("mic"))return"mic";if(s.includes("rack"))return"rack";if(s.includes("sample-surgery")||s.includes("big-deal")||s.includes("granulator")||s.includes("chop"))return"processed";if(s.includes("import"))return"imported";return"other"}
function open(){if(dbp)return dbp;dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:"id"});s.createIndex("createdAt","createdAt");s.createIndex("name","name")}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbp}
function tx(mode,fn){return open().then(db=>new Promise((resolve,reject)=>{const t=db.transaction(STORE,mode),s=t.objectStore(STORE);let result;try{result=fn(s,t)}catch(e){reject(e);return}t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error("Grain transaction aborted"))}))}
function id(){return"grain-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)}
async function save(grain){if(!grain?.data?.length||!grain.sampleRate)throw new Error("Grain requires data and sampleRate");const data=grain.data instanceof Float32Array?grain.data:new Float32Array(grain.data),now=Date.now(),rec={id:grain.id||id(),name:String(grain.name||"GRAIN"),sampleRate:Number(grain.sampleRate),channels:1,frames:data.length,duration:data.length/Number(grain.sampleRate),createdAt:Number(grain.createdAt)||now,updatedAt:now,sourceId:grain.sourceId?String(grain.sourceId):null,sourceName:String(grain.sourceName||""),startFrame:Number(grain.startFrame)||0,endFrame:Number(grain.endFrame)||data.length,tags:Array.isArray(grain.tags)?grain.tags.map(String):[],folder:grain.folder?String(grain.folder):"grains",data};await tx("readwrite",s=>s.put(rec));global.dispatchEvent(new CustomEvent("multisynth-grain-library",{detail:{action:"save",id:rec.id,name:rec.name,folder:rec.folder}}));return{...rec,data:undefined,library:"grain"}}
async function get(id){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readonly"),r=t.objectStore(STORE).get(String(id));r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
async function list(){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readonly"),r=t.objectStore(STORE).getAll();r.onsuccess=()=>resolve((r.result||[]).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(x=>({...x,data:undefined,library:"grain",folder:x.folder||"grains",source:"grain-library"})));r.onerror=()=>reject(r.error)})}
async function remove(id){await tx("readwrite",s=>s.delete(String(id)));global.dispatchEvent(new CustomEvent("multisynth-grain-library",{detail:{action:"delete",id:String(id)}}));return true}
async function rename(id,name){const rec=await get(id);if(!rec)return false;rec.name=String(name||rec.name);rec.updatedAt=Date.now();await tx("readwrite",s=>s.put(rec));global.dispatchEvent(new CustomEvent("multisynth-grain-library",{detail:{action:"rename",id:rec.id,name:rec.name}}));return true}
async function setFolder(id,folder){const rec=await get(id);if(!rec)return false;rec.folder=safeFolder(folder);rec.updatedAt=Date.now();await tx("readwrite",s=>s.put(rec));global.dispatchEvent(new CustomEvent("multisynth-grain-library",{detail:{action:"folder",id:rec.id,folder:rec.folder}}));return true}
const Grain=Object.freeze({open,save,get,list,remove,rename,setFolder});
async function unifiedList(){const [pcm,grains]=await Promise.all([PCM?.list?.()||[],list()]);return[...pcm.map(x=>({...x,library:"pcm",folder:classify(x)})),...grains.map(x=>({...x,folder:classify(x)}))].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))}
async function getUnified(key){if(String(key||"").startsWith("grain-")){const g=await get(key);return g?{...g,library:"grain",folder:classify(g),source:"grain-library"}:null}const p=await PCM?.get?.(key);if(p)return{...p,library:"pcm",folder:classify(p)};const g=await get(key);return g?{...g,library:"grain",folder:classify(g),source:"grain-library"}:null}
async function setUnifiedFolder(key,folder){folder=safeFolder(folder);return String(key||"").startsWith("grain-")?setFolder(key,folder):PCM.setFolder?.(key,folder)}
async function copyToFolder(key,folder){folder=safeFolder(folder);const rec=await getUnified(key);if(!rec?.data?.length)return null;const copyName=String(rec.name||"SAMPLE")+" COPY";if(rec.library==="grain")return save({name:copyName,sampleRate:rec.sampleRate,data:rec.data,sourceId:rec.sourceId,sourceName:rec.sourceName,startFrame:rec.startFrame,endFrame:rec.endFrame,tags:[...(rec.tags||[]),"copy"],folder});return PCM.save({name:copyName,sampleRate:rec.sampleRate,data:rec.data,source:rec.source||"sample-library-copy",tags:[...(rec.tags||[]),"copy"],folder})}
const Unified=Object.freeze({
 list:unifiedList,
 async listFolder(folder){folder=safeFolder(folder);return(await unifiedList()).filter(x=>classify(x)===folder)},
 async folders(){const all=await unifiedList(),counts={};for(const x of all){const f=classify(x);counts[f]=(counts[f]||0)+1}return[...folderDefs.values()].sort((a,b)=>a.order-b.order||a.label.localeCompare(b.label)).map(f=>({...f,count:counts[f.id]||0}))},
 folderFor:rec=>classify(rec),registerFolder,
 get:getUnified,
 save:v=>PCM.save(v),saveCapture:(...a)=>PCM.saveCapture(...a),remove:key=>String(key||"").startsWith("grain-")?remove(key):PCM.remove(key),rename:(key,name)=>String(key||"").startsWith("grain-")?rename(key,name):PCM.rename(key,name),setFolder:setUnifiedFolder,copyToFolder,open:()=>Promise.all([PCM?.open?.(),open()])
});
MS.RawPCMLibrary=PCM;MS.GrainLibrary=Grain;MS.UnifiedLibrary=Unified;MS.PCMLibrary=Unified;
})(window);
