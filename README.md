# MultiSynth

> READ THIS FILE BEFORE MAKING ANY CODE CHANGE.
>
> This README is the canonical architecture contract for both `main` and `alt`. Keep the two copies synchronized whenever the architecture, build order, or ownership rules change.

MultiSynth is an Android-hosted HTML5 modular audio workstation. The Android shell should remain thin: WebView hosting, lifecycle/back integration, permissions, microphone/file access, and native MIDI/Bluetooth transport. The instrument, routing, graph, and control systems live in HTML/CSS/JavaScript.

## Current recovery plan

The existing implementation remains intact on `main` as reference/history. A clean replacement is being built on branch `alt` under `app/src/main/assets/alt/`.

Build order for `alt` is strict:

1. Node Graph — explicit nodes, explicit cables, instances only.
2. Bottom-level sound path — minimal carrier/CV routing primitives and the tools required to inspect/test them.
3. Shared control library — reusable CSS/JS controls designed once for all modules.
4. Module declaration layer — modules declare controls/state/theme/DSP; they do not build private UI infrastructure.
5. Migrate modules one at a time from the existing repo only after the lower layers are stable.

Do not reverse this order to solve an individual module bug.

## Non-negotiable architecture rules

### One owner per shared thing

Every reusable behavior has exactly one authoritative implementation.

- Node Graph owns graph instances, ports, cables, placement, selection, and removal of graph instances.
- Audio core owns generic carrier/CV routing and graph connection lifetime.
- A module owns its DSP and module-specific state only.
- Shared controls own their DOM, interaction behavior, and geometry.
- Module themes own appearance tokens only.
- Module declarations describe which shared controls exist, their labels/ranges/state keys/grouping, and their theme.

Consumers do not recreate or compensate for shared behavior.

### No workaround layers

Do not add editor-specific patches, compatibility shims, duplicate renderers, compensating CSS, second state stores, or module-specific copies of shared controls to make a symptom disappear.

If a shared knob, step bank, keyboard, scope, selector, ADSR, routing primitive, or graph behavior is wrong, fix its authoritative owner.

### Shared controls really are shared

The control library should remain small and obvious. Atomic primitives include:

- knob and dial
- toggle
- momentary and hold buttons
- selector/button bank
- general track/instrument bank
- fader and fader bank
- ribbon
- pad bank
- multi-lane step bank/sequencer grid
- text input/readout/display
- XY pad and spring joystick
- touchscreen
- turntable/scrub surface
- LED and LED ring
- knob bank
- reusable controller IN/OUT jack pair

Every controller is rendered as one faceplate unit containing the controller itself and its IN/OUT jacks in the same control div. The shared jack primitive owns jack DOM/geometry; the generic renderer composes the pair onto every declared controller. Modules only declare the state binding and port ids/kind. Do not build separate per-module control-port panels.

Compound prefabs include:

- ADSR
- performance keyboard
- oscilloscope

Changing a shared control must automatically change every module that declares it.

A multi-lane step bank is still one shared step-bank primitive. For example, a drum machine may bind 12 independent tracks to one visible bank of 32 toggles by changing the selected lane. The module must not create another step-grid implementation to achieve that behavior.

### State has one source of truth

UI state, DSP state, persistence state, and playback must refer to the same canonical module state. Do not maintain a separate UI copy of a sequencer pattern or other control state.

Controls receive current state and emit state changes. Renderers do not invent module behavior.

### Node Graph rules

The Node Graph is the authoritative external routing model.

- Every placed module or rack is an instance.
- Position never implies routing.
- Routing exists only through explicit cables.
- Nodes expose explicit ports.
- Start with two IN and two OUT ports for both modules and racks; extend module-specific ports deliberately later.
- Removing a node removes that graph instance only. Installed module definitions are not deleted from the module library by graph removal.
- Racks are compact reusable complex instrument/processor chains represented as a single node externally.

### Audio rules

Keep the bottom audio layer minimal.

- Carrier/audio routing is separate from CV/control routing.
- Modules process/synthesize; graph code connects.
- Generic routing code must not reach into module DSP internals to repair behavior.
- Fundamental source constructors should have one lowest-level owner.
- No silent audio/DSP shims.
- Incoming carrier audio remains usable unless a module is intentionally generator-only.
- Oscilloscopes show the relevant post-process signal.
- Resources are cleaned up when an instance is destroyed.

### CSS/theme rules

Shared control CSS owns geometry and interaction-related layout. Module themes provide semantic appearance variables/tokens. A module may make a knob chocolate, cream, surgical, Amiga-blue, etc.; it may not redefine what a knob is or how it behaves.

There is one vertical module layout. Rotation may widen that layout but does not create a separate landscape composition.

## `alt` directory structure

The clean implementation starts here:

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
    prefabs.js
  modules/
```

Keep files narrow in responsibility. Do not create a general-purpose manager when a small explicit module will do.

Every source file created under `alt` begins with a concise top-of-file ownership/purpose comment stating what that file owns and, where useful, what it explicitly does not own. Preserve that comment when editing the file.

## Change discipline

Before changing code:

1. Read this README.
2. Identify the authoritative owner of the behavior.
3. Trace the actual state/call/render/routing path.
4. Change the smallest authoritative layer that solves the problem for all consumers.
5. Do not perform adjacent cleanup unless requested.
6. Update this README on both `main` and `alt` if an architecture rule or build-order decision changes.

Before deleting, renaming, replacing, or broadly refactoring existing files, list the proposed files/changes and get explicit approval first.

## Existing implementation

The current production/reference implementation still lives in `app/src/main/assets/`. Its Git history is valuable. Do not delete it while `alt` is being built. Reuse verified DSP equations, module behavior, names, themes, and assets deliberately; do not copy architecture merely because it already exists.

## Definition of success for `alt`

The replacement is successful when the system is understandable from the bottom up:

- explicit Node Graph
- small audio/routing core
- small reusable control library
- declarative modules
- one state source of truth
- no module-specific copies of shared controls
- no editor workarounds for primitive defects
- no hidden compatibility layers

If a simple module requires a complicated editor or special-case renderer, the architecture is wrong.