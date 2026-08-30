# MultiSynth

> READ THIS FILE BEFORE MAKING ANY CODE CHANGE.
>
> This README is the canonical architecture contract for both `main` and `alt`. Keep the two copies synchronized whenever the architecture, build order, or ownership rules change.

MultiSynth is an Android-hosted HTML5 modular audio workstation. The Android shell stays thin. Instrument, routing, graph, control, prefab, face-compilation, and module systems live in HTML/CSS/JavaScript.

## Final architecture

The architecture is intentionally bottom-up:

1. **Node Graph** — the single reusable circuit editor/runtime surface. Every builder is just an instance of the Node Graph.
2. **Audio core** — minimal carrier/CV routing and connection lifetime.
3. **Shared controls** — the atomic reusable interaction library.
4. **Named prefabs** — reusable compositions made from controls and/or other prefabs.
5. **Modules** — circuits/DSP made from controls and prefabs, with module-specific state and DSP only.
6. **Graph compiler/output target** — the same Node Graph can compile its circuit as a prefab, module, rack/compound unit, or ordinary patch/workspace object. The output type changes; the editor does not.
7. **Face compiler** — after a compiled prefab/module circuit exists, compiles its declared controls/prefabs into a usable control face.
8. **Face renderer/editor** — renders the compiled face and permits only whole-div vertical reordering of ordinary face units. Pinned performance units do not participate in reordering.

The existing implementation on `main` remains reference/history while the clean replacement is built under `app/src/main/assets/alt/` on `alt`. Migrate modules only after the lower shared layers are stable.

## One authoritative owner

Every reusable behavior has exactly one owner.

- Node Graph owns graph instances, ports, cables, placement, selection, removal, patch persistence, graph editing behavior, builder behavior, and each instance's saved face-order override.
- Graph workspace owns open graph tabs, each graph document's intended output metadata, and each graph's public interface metadata.
- Graph compilation owns conversion of a Node Graph circuit into the requested output type. Prefab/module/rack/patch are output contracts, not separate editors.
- Audio core owns generic carrier/CV routing and graph connection lifetime.
- Shared controls own control DOM, geometry and gestures.
- Prefab registry owns named reusable compositions, not control behavior or layout implementation.
- Face compiler owns automatic initial face order and pin rules.
- Face renderer owns DOM composition from compiled packets and the reorder interaction.
- A module owns module-specific DSP and canonical module state only.
- Themes own appearance tokens only.

Do not add separate prefab-builder, module-builder, rack-builder, or patch-builder implementations. Do not add compatibility shims, duplicate renderers, module-specific control copies, compensating CSS, second state stores, or editor-specific layout implementations.

## Shared controls

Atomic controls are reusable and behaviorally authoritative:

- knob and dial — touch/drag vertically
- toggle switch — tap toggles persistent state
- momentary switch — down is on; release/cancel is off; there is no separate hold control
- selector/button bank
- track/instrument bank
- fader and fader bank
- ribbon
- pad and pad bank — pads are triggers, not persistent selectors
- multi-lane step bank/sequencer grid
- text input/readout/display
- XY pad and spring joystick
- touchscreen
- turntable/scrub surface
- LED and LED ring
- knob bank
- reusable controller IN/OUT jack pair

Every modulatable controller is one faceplate unit containing the controller and its IN/OUT jacks. Modules declare state bindings and port IDs/kinds; they never build separate control-port panels.

## Named prefabs

A prefab is **not a control** and not a special editor. It is one possible compiled output of a Node Graph circuit: a named reusable composition built from shared controls and/or other named prefabs.

Users build the circuit in a Node Graph instance, choose/assign the output type `prefab`, give it a name, and compile/save it. That prefab can then be inserted into any other Node Graph instance and can participate in a later module/rack/prefab build.

Canonical examples include ADSR, performance keyboard, and oscilloscope. ADSR is a prefab composed from controls; it is not an atomic control.

A prefab's internal declarations go through the same face compiler. Prefabs do not hard-code private control geometry or interaction behavior.

## Modules

A module is likewise a compiled Node Graph circuit, not the product of a separate module editor. The same graph can be compiled as a module by changing its output type.

A module circuit may contain controls and prefabs and owns its resulting module-specific DSP/state contract. Building the circuit determines what exists and how it behaves; it does not hand-author the final control-face DOM.

Modules declare controls/prefabs, state bindings, routing metadata, labels, theme tokens and any explicit pin metadata. They do not implement shared controls, prefab internals, or face layout CSS.

## Node Graph builders and output types

There is one builder: **Node Graph**.

A prefab builder, module builder, rack builder, and ordinary patch builder are the same graph implementation instantiated with a different intended output contract. They are deliberately interchangeable because they edit the same fundamental thing: an explicit circuit of graph nodes and cables.

The graph does not become a different editor when the output type changes. The output type determines what compilation emits and what metadata must be supplied, for example a reusable name/identity for a prefab or module. Circuit editing, routing, insertion, selection, persistence, and graph interaction stay identical.

A compiled output may later be inserted as a node in another Node Graph. This nesting is normal and does not require another editor architecture.

Do not create parallel builder UIs or separate graph implementations for different output types.

## Graph public interface

Every graph document has a public boundary interface used when that graph is saved/compiled as a reusable prim or module.

Defaults are always present:

- Carrier IN
- CV IN
- Carrier OUT
- CV OUT

The graph displays an **IN bus** and an **OUT bus**. Touching either bus opens the shared boundary selector. The user may add additional public Carrier or CV inputs/outputs from that list. Added boundary ports are graph-document metadata, not module DSP state.

The saved prim/module asset receives the graph's exact public interface. Compilation/runtime wiring must map those declared public ports to the graph circuit; do not infer extra public ports from node position or hidden heuristics.

## Face compilation and editing

Face compilation is the final presentation step after the actual prefab/module circuit has been built.

`Node Graph circuit -> output compile -> declarations -> face compile -> ordered face divs -> saved user reorder -> render`

Rules:

- The compiler proposes a usable initial face automatically.
- Every top-level control or prefab becomes one **full-width component div** in a vertical face.
- Each compiled div receives a stable face ID.
- Ordinary divs may only be reordered vertically as whole units. No free positioning, resizing, overlap, arbitrary pixel coordinates, or per-module layout CSS.
- Reordering changes presentation only. It never rewrites the circuit, control, prefab, DSP, or module declaration.
- The Node Graph persists only the ordered stable IDs as the instance's face-layout override.
- If there is no override, compiler order is authoritative.
- New components absent from an older override fall back into compiler order without destroying the saved order of known components.
- Resetting a face means removing its order override and returning to compiler order.
- Performance tools may be pinned. `performance-keyboard` is pinned to the bottom by contract and is excluded from ordinary reordering.
- Prefabs use the same compilation rule internally, and a prefab placed in a module remains one top-level module-face div.

This is the final face-layout architecture. Do not introduce grid packing, manual spans, arbitrary coordinates, resizing, or module-owned face composition as alternate systems.

## State

UI, DSP, persistence and playback refer to the same canonical module state. Face-order persistence is graph-instance presentation metadata, not DSP/module state. Builder/output-type and public-interface metadata are graph metadata, not a separate editor state system. Controls receive current state and emit changes; renderers do not invent module behavior.

## Node Graph

The Node Graph is the authoritative routing and circuit-authoring model. Position never implies routing; routing exists only through explicit cables. Nodes expose explicit ports. Removing a node removes that graph instance only. Compiled prefabs/modules/racks remain single external graph instances when inserted into another graph.

## Audio

Carrier/audio routing is separate from CV/control routing. Modules process/synthesize; graph code connects. Generic routing must not reach into module DSP internals. Fundamental source constructors have one lowest-level owner. No silent DSP shims. Resources are cleaned up on destroy.

## CSS/themes

Shared control CSS owns control geometry. Face-compiler CSS owns vertical compiled-face geometry. Themes provide semantic appearance variables only. There is one vertical module layout; rotation may widen it but does not create a second composition system.

## `alt` structure

```text
app/src/main/assets/alt/
  index.html
  node-graph/
    node-graph.html
    node-graph.css
    graph-tabs.js
    graph-boundary.js
    node-graph.js
  core/
    state.js
    audio.js
  controls/
    controls.css
    controls.js
    control-jacks.css
    control-jacks.js
    face-compiler.css
    face-compiler.js
    prefabs.js
    control-renderer.js
  modules/
```

Every source file under `alt` starts with a concise ownership/purpose comment.

## Change discipline

Before changing code: read this README, identify the authoritative owner, trace the actual state/call/render/routing path, change the smallest authoritative layer, and do not perform adjacent cleanup. Before deleting, renaming, replacing, or broadly refactoring existing files, list exact proposed changes and get explicit approval.

Reuse verified DSP equations, module behavior, names, themes, and assets deliberately; do not copy old architecture merely because it exists.

## Definition of success

The replacement is successful when it has one reusable Node Graph serving every builder/output workflow, explicit routing, explicit graph boundary interfaces, a small audio core, one shared control library, composable named prefabs, graph-compiled modules, automatic face compilation, reorder-only face editing, one canonical module state, and no hidden compatibility or builder-specific UI layers.

If a prefab, module, or rack requires a separate editor or a special-case renderer, the architecture is wrong.
