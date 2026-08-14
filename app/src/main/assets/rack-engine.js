"use strict";

/* MultiSynth spatial rack graph engine. See docs/RACK_ARCHITECTURE.md. */
(function (global) {
    const racks = new Map();
    const cells = new Map();
    const definitions = new Map();
    const listeners = new Map();
    let rackSerial = 0;
    let moduleSerial = 0;

    const key = (r, c) => `${r}:${c}`;
    const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
    const id = (prefix, n) => `${prefix}-${Date.now().toString(36)}-${n.toString(36)}`;

    function emit(type, payload) {
        listeners.get(type)?.forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } });
        global.dispatchEvent(new CustomEvent("multisynth-rack-engine", {detail:{type,payload}}));
    }
    function on(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
        return () => listeners.get(type)?.delete(fn);
    }

    function defineModule(def) {
        if (!def?.type) throw new Error("Module definition requires type");
        const clean = {
            type:String(def.type), version:String(def.version || "1"), kind:String(def.kind || "instrument"),
            defaults:clone(def.defaults || {}), create:typeof def.create === "function" ? def.create : null
        };
        definitions.set(clean.type, clean);
        return clean.type;
    }

    function moduleInstance(type, state) {
        const def = definitions.get(type);
        if (!def) throw new Error(`Unknown module type: ${type}`);
        return {id:id(type, ++moduleSerial), type, version:def.version, kind:def.kind,
            enabled:true, state:Object.assign({}, clone(def.defaults), clone(state || {}))};
    }

    function addRack(row, col, opts={}) {
        row |= 0; col |= 0;
        if (cells.has(key(row,col))) throw new Error(`Rack cell occupied: ${row},${col}`);
        const rack = {id:String(opts.id || id("rack", ++rackSerial)), row, col, enabled:opts.enabled !== false,
            gain:Number.isFinite(opts.gain) ? opts.gain : 1, modules:[]};
        racks.set(rack.id, rack); cells.set(key(row,col), rack.id);
        emit("rack-added", snapshotRack(rack)); changed();
        return rack.id;
    }

    function removeRack(rackId) {
        const r = need(rackId); cells.delete(key(r.row,r.col)); racks.delete(rackId);
        emit("rack-removed", {id:rackId}); changed();
    }

    function moveRack(rackId,row,col) {
        const r=need(rackId); row|=0; col|=0; const k=key(row,col);
        if (cells.has(k) && cells.get(k)!==rackId) throw new Error(`Rack cell occupied: ${row},${col}`);
        cells.delete(key(r.row,r.col)); r.row=row; r.col=col; cells.set(k,rackId);
        emit("rack-moved", snapshotRack(r)); changed();
    }

    function need(rackId) { const r=racks.get(rackId); if(!r) throw new Error(`Unknown rack: ${rackId}`); return r; }
    function at(row,col) { const rid=cells.get(key(row,col)); return rid ? racks.get(rid) : null; }

    function neighborhood(rackId) {
        const r=need(rackId), find=(dr,dc)=>at(r.row+dr,r.col+dc)?.id || null;
        return {
            parents:[find(-1,-1),find(-1,0),find(-1,1)].filter(Boolean),
            siblings:[find(0,-1),find(0,1)].filter(Boolean),
            children:[find(1,-1),find(1,0),find(1,1)].filter(Boolean)
        };
    }

    function graph() {
        const edges=[];
        for (const r of racks.values()) {
            if (!r.enabled) continue;
            for (const childId of neighborhood(r.id).children) {
                if (racks.get(childId)?.enabled) edges.push({from:r.id,to:childId,type:"parent-child"});
            }
        }
        return {racks:[...racks.values()].map(snapshotRack),edges};
    }

    function addModule(rackId,type,state,index) {
        const r=need(rackId), m=moduleInstance(type,state);
        const i=Number.isInteger(index) ? Math.max(0,Math.min(index,r.modules.length)) : r.modules.length;
        r.modules.splice(i,0,m); emit("module-added",{rackId,module:clone(m),index:i}); changed(); return m.id;
    }
    function removeModule(rackId,moduleId) {
        const r=need(rackId), i=r.modules.findIndex(m=>m.id===moduleId);
        if(i<0) throw new Error(`Unknown module instance: ${moduleId}`);
        const [m]=r.modules.splice(i,1); emit("module-removed",{rackId,moduleId:m.id}); changed();
    }
    function moveModule(rackId,moduleId,index) {
        const r=need(rackId), old=r.modules.findIndex(m=>m.id===moduleId);
        if(old<0) throw new Error(`Unknown module instance: ${moduleId}`);
        const [m]=r.modules.splice(old,1); const next=Math.max(0,Math.min(index|0,r.modules.length)); r.modules.splice(next,0,m);
        emit("module-moved",{rackId,moduleId,index:next}); changed();
    }
    function setModuleState(rackId,moduleId,patch) {
        const r=need(rackId), m=r.modules.find(x=>x.id===moduleId);
        if(!m) throw new Error(`Unknown module instance: ${moduleId}`);
        Object.assign(m.state,clone(patch || {})); emit("module-state",{rackId,moduleId,state:clone(m.state)});
    }

    function snapshotRack(r) { return {id:r.id,row:r.row,col:r.col,enabled:r.enabled,gain:r.gain,modules:clone(r.modules)}; }
    function changed(){ emit("graph-changed",graph()); }

    function executionPlan() {
        const enabled=[...racks.values()].filter(r=>r.enabled).sort((a,b)=>a.row-b.row || a.col-b.col);
        return enabled.map(r=>({rackId:r.id,row:r.row,col:r.col,parents:neighborhood(r.id).parents,
            siblings:neighborhood(r.id).siblings,children:neighborhood(r.id).children,
            ladder:r.modules.filter(m=>m.enabled).map(m=>m.id)}));
    }

    function serialize(meta={}) {
        return JSON.stringify({format:"multisynth-spatial-rack",version:1,meta:clone(meta),racks:[...racks.values()].map(snapshotRack)});
    }

    function clear(){ racks.clear(); cells.clear(); changed(); }

    function restore(json) {
        const data=typeof json==="string" ? JSON.parse(json) : json;
        if(data?.format!=="multisynth-spatial-rack") throw new Error("Not a MultiSynth spatial rack project");
        clear();
        for(const saved of data.racks || []) {
            const rid=addRack(saved.row,saved.col,{id:saved.id,enabled:saved.enabled,gain:saved.gain});
            const r=need(rid); r.modules=clone(saved.modules || []);
        }
        changed(); return clone(data.meta || {});
    }

    global.MultiSynth=global.MultiSynth || {};
    global.MultiSynth.RackEngine=Object.freeze({
        defineModule,addRack,removeRack,moveRack,addModule,removeModule,moveModule,setModuleState,
        neighborhood,graph,executionPlan,serialize,restore,clear,on,
        getRack:rackId=>snapshotRack(need(rackId)),
        rackAt:(row,col)=>{const r=at(row,col);return r?snapshotRack(r):null;}
    });
})(window);
