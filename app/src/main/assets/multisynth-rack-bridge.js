"use strict";

/*
 * MultiSynth Rack Bridge
 * ----------------------
 * Architecture contract for the coming rack builder.
 *
 * GRID SEMANTICS
 *   - Modules occupy cells in a virtual 2-D rack grid.
 *   - TOP -> DOWN is the synthesis/audio cascade (serial neighborhood).
 *   - SIDE BY SIDE modules at the same row are PARALLEL branches.
 *   - Routing is derived from local grid neighborhood, not instrument names.
 *   - Every placed module is an INSTANCE with independent state.
 *   - Native Android resources are shared services; instances subscribe to them.
 *
 * This file intentionally does not implement DSP. It defines identity, topology,
 * native-resource access, events and serialization so DSP modules remain portable.
 */
(function (global) {
    const Native = global.AndroidBridge || null;
    const listeners = new Map();
    const instances = new Map();
    const cells = new Map();
    let projectId = "default";
    let serial = 0;

    function uid(type) {
        serial += 1;
        return String(type || "module") + "-" + Date.now().toString(36) + "-" + serial.toString(36);
    }

    function cellKey(row, col) { return row + ":" + col; }

    function emit(type, detail) {
        const set = listeners.get(type);
        if (set) set.forEach(fn => { try { fn(detail); } catch (e) { console.error(e); } });
        global.dispatchEvent(new CustomEvent("multisynth-rack", { detail: { type, payload: detail } }));
    }

    function on(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
        return () => listeners.get(type)?.delete(fn);
    }

    function normalizeDefinition(def) {
        if (!def || !def.type) throw new Error("Module definition requires type");
        return {
            type: String(def.type),
            version: String(def.version || "1"),
            kind: String(def.kind || "instrument"),
            inputs: Array.isArray(def.inputs) ? def.inputs.slice() : ["audio"],
            outputs: Array.isArray(def.outputs) ? def.outputs.slice() : ["audio"],
            defaults: def.defaults && typeof def.defaults === "object" ? structuredClone(def.defaults) : {}
        };
    }

    function createInstance(definition, placement, restoredState) {
        const def = normalizeDefinition(definition);
        const p = placement || {};
        const instance = {
            id: String(p.id || uid(def.type)),
            type: def.type,
            version: def.version,
            kind: def.kind,
            row: Number.isInteger(p.row) ? p.row : 0,
            col: Number.isInteger(p.col) ? p.col : 0,
            enabled: p.enabled !== false,
            state: Object.assign({}, def.defaults, restoredState || {}),
            inputs: def.inputs,
            outputs: def.outputs,
            subscriptions: new Set()
        };
        const key = cellKey(instance.row, instance.col);
        if (cells.has(key)) throw new Error("Rack cell already occupied: " + key);
        instances.set(instance.id, instance);
        cells.set(key, instance.id);
        emit("instance-added", publicInstance(instance));
        emit("topology-changed", topology());
        return instanceHandle(instance.id);
    }

    function publicInstance(i) {
        return {
            id: i.id, type: i.type, version: i.version, kind: i.kind,
            row: i.row, col: i.col, enabled: i.enabled,
            state: structuredClone(i.state), inputs: i.inputs.slice(), outputs: i.outputs.slice()
        };
    }

    function instanceHandle(id) {
        return {
            id,
            get: () => publicInstance(requireInstance(id)),
            setState: patch => setInstanceState(id, patch),
            move: (row, col) => moveInstance(id, row, col),
            remove: () => removeInstance(id),
            subscribe: resource => subscribeResource(id, resource),
            unsubscribe: resource => unsubscribeResource(id, resource)
        };
    }

    function requireInstance(id) {
        const i = instances.get(id);
        if (!i) throw new Error("Unknown rack instance: " + id);
        return i;
    }

    function setInstanceState(id, patch) {
        const i = requireInstance(id);
        if (patch && typeof patch === "object") Object.assign(i.state, patch);
        emit("instance-state", { id, state: structuredClone(i.state) });
    }

    function moveInstance(id, row, col) {
        const i = requireInstance(id);
        row = row | 0; col = col | 0;
        const next = cellKey(row, col);
        if (cells.has(next) && cells.get(next) !== id) throw new Error("Rack cell already occupied: " + next);
        cells.delete(cellKey(i.row, i.col));
        i.row = row; i.col = col;
        cells.set(next, id);
        emit("instance-moved", publicInstance(i));
        emit("topology-changed", topology());
    }

    function removeInstance(id) {
        const i = requireInstance(id);
        cells.delete(cellKey(i.row, i.col));
        instances.delete(id);
        emit("instance-removed", { id });
        emit("topology-changed", topology());
    }

    /*
     * Neighborhood topology:
     * A row is a parallel stage. Every enabled module in that row receives the
     * output bus from the nearest populated row above. Their outputs form the bus
     * delivered to the nearest populated row below. Thus vertical movement is
     * serial/cascade and horizontal placement creates parallel synthesis branches.
     */
    function topology() {
        const active = [...instances.values()].filter(i => i.enabled);
        const rows = [...new Set(active.map(i => i.row))].sort((a, b) => a - b);
        const stages = rows.map((row, index) => {
            const members = active.filter(i => i.row === row).sort((a, b) => a.col - b.col);
            return {
                row,
                mode: members.length > 1 ? "parallel" : "serial",
                instances: members.map(i => i.id),
                upstreamRow: index ? rows[index - 1] : null,
                downstreamRow: index < rows.length - 1 ? rows[index + 1] : null
            };
        });
        const edges = [];
        for (let s = 0; s < stages.length - 1; s++) {
            for (const from of stages[s].instances) {
                for (const to of stages[s + 1].instances) edges.push({ from, to, relation: "cascade" });
            }
        }
        return { stages, edges };
    }

    function neighbors(id) {
        const i = requireInstance(id);
        const t = topology();
        const stageIndex = t.stages.findIndex(s => s.instances.includes(id));
        if (stageIndex < 0) return { parallel: [], upstream: [], downstream: [] };
        const stage = t.stages[stageIndex];
        return {
            parallel: stage.instances.filter(x => x !== id),
            upstream: stageIndex > 0 ? t.stages[stageIndex - 1].instances.slice() : [],
            downstream: stageIndex < t.stages.length - 1 ? t.stages[stageIndex + 1].instances.slice() : []
        };
    }

    function subscribeResource(id, resource) {
        const i = requireInstance(id);
        i.subscriptions.add(String(resource));
        emit("resource-subscribe", { id, resource: String(resource) });
        return true;
    }

    function unsubscribeResource(id, resource) {
        const i = requireInstance(id);
        i.subscriptions.delete(String(resource));
        emit("resource-unsubscribe", { id, resource: String(resource) });
    }

    const native = {
        available: () => !!Native,
        version: () => Native?.version?.() || "web",
        requestAudioFocus: () => Native?.requestAudioFocus?.() ?? false,
        abandonAudioFocus: () => Native?.abandonAudioFocus?.(),
        mic: {
            permitted: () => Native?.hasMicrophonePermission?.() ?? false,
            requestPermission: () => Native?.requestMicrophonePermission?.(),
            start: () => Native?.startMic?.() ?? false,
            stop: () => Native?.stopMic?.()
        },
        midi: {
            permitted: () => Native?.hasBluetoothPermission?.() ?? false,
            requestPermission: () => Native?.requestBluetoothPermission?.(),
            list: () => { try { return JSON.parse(Native?.listMidiInputs?.() || "[]"); } catch (_) { return []; } },
            choose: () => Native?.chooseMidiInput?.(),
            disconnect: () => Native?.disconnectMidi?.()
        },
        files: {
            open: mime => Native?.openFile?.(mime || "*/*"),
            saveBase64: (name, mime, data) => Native?.saveBase64File?.(name, mime, data)
        },
        storage: {
            put: (key, value) => Native?.putString?.(projectId + ":" + key, value),
            get: (key, fallback = null) => Native?.getString?.(projectId + ":" + key, fallback) ?? fallback,
            remove: key => Native?.remove?.(projectId + ":" + key)
        }
    };

    function serialize() {
        return JSON.stringify({
            format: "multisynth-rack",
            version: 1,
            projectId,
            instances: [...instances.values()].map(publicInstance)
        });
    }

    function clear() {
        instances.clear(); cells.clear(); emit("topology-changed", topology());
    }

    global.addEventListener("multisynth-native", e => emit("native", e.detail));

    global.MultiSynth = global.MultiSynth || {};
    global.MultiSynth.rack = Object.freeze({
        setProjectId(id) { projectId = String(id || "default"); },
        createInstance,
        getInstance: id => instanceHandle(requireInstance(id).id),
        listInstances: () => [...instances.values()].map(publicInstance),
        moveInstance,
        removeInstance,
        neighbors,
        topology,
        serialize,
        clear,
        on,
        native
    });
})(window);
