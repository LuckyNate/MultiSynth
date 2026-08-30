# MultiSynth

> READ THIS FILE BEFORE MAKING ANY CODE CHANGE.
>
> This README is the canonical architecture contract for both `main` and `alt`. Keep the two copies synchronized whenever the architecture, build order, or ownership rules change.

MultiSynth is an Android-hosted HTML5 modular audio workstation. The Android shell stays thin. Instrument, routing, graph, control, prefab, face-compilation, and module systems live in HTML/CSS/JavaScript.

## Final architecture

The architecture is intentionally bottom-up:

1. **Node Graph** — explicit instances, ports, cables, placement and patch persistence.
2. **Audio core** — minimal carrier/CV routing and connection lifetime.
3. **Shared controls** — the atomic reusable interaction library.
4. **Named prefabs** — reusable compositions made from controls and/or other prefabs.
5. **Modules** — circuits/DSP made from controls and prefabs, with module-specific state and DSP only.
6. **Face compiler** — after a prefab or module circuit exists, compiles its declared controls/prefabs into a usable control face.
7. **Face renderer/editor** — renders the compiled face and permits only whole-div vertical reordering of ordinary face units. Pinned performance units do not participate in reordering.

The existing implementation on `main` remains reference/history while the clean replacement is built under `app/src/main/assets/alt/` on `alt`. Migrate modules only after the lower shared layers are stable.

## One authoritative owner

Every reusable behavior has exactly one owner.

- Node Graph owns graph instances, ports, cables, placement, selection, removal, patch persistence, and each instance's saved face-order override.
- Audio core owns generic carrier/CV routing and graph connection lifetime.
- Shared controls own control DOM, geometry and gestures.
- Prefab registry owns named reusable compositions, not control behavior or layout implementation.
- Face compiler owns automatic initial face order and pin rules.
- Face renderer owns DOM composition from compiled packets and the reorder interaction.
- A module owns module-specific DSP and canonical module state only.
- Themes own appearance tokens only.

Do not add compatibility shims, duplicate renderers, module-specific control copies, compensating CSS, second state stores, or editor-specific layout implementations.

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

A prefab is **not a control**. It is a named reusable composition built from shared controls and/or other named prefabs. Users must be able to build and name prefabs, then use those prefabs when building modules.

Canonical examples include ADSR, performance keyboard, and oscilloscope. ADSR is a prefab composed from controls; it is not an atomic control.

A prefab's internal declarations go through the same face compiler. Prefabs do not hard-code private control geometry or interaction behavior.

## Modules

A module is a circuit/DSP definition assembled from controls and prefabs. Building the circuit determines what exists and how it behaves; it does not hand-author the final control-face DOM.

Modules declare controls/prefabs, state bindings, routing metadata, labels, theme tokens and any explicit pin metadata. They do not implement shared controls, prefab internals, or face layout CSS.

## Face compilation and editing

Face compilation is the final presentation step after the actual prefab/module circuit has been built.

`circuit -> declarations -> face compile -> ordered face divs -> saved user reorder -> render`

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

UI, DSP, persistence and playback refer to the same canonical module state. Face-order persistence is graph-instance presentation metadata, not DSP/module state. Controls receive current state and emit changes; renderers do not invent module behavior.

## Node Graph

The Node Graph is the authoritative external routing model. Position never implies routing; routing exists only through explicit cables. Nodes expose explicit ports. Removing a node removes that graph instance only. Racks/complex modules remain single external graph instances.

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

The replacement is successful when it has explicit graph routing, a small audio core, one shared control library, composable named prefabs, declarative modules, automatic face compilation, reorder-only face editing, one canonical module state, and no hidden compatibility or module-specific UI layers.

If a simple module requires a special-case renderer or private control implementation, the architecture is wrong.
