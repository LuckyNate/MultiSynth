# MultiSynth App Architecture

## Purpose

MultiSynth is a phone-first Android-hosted HTML5 modular synthesizer and audio workstation.

The ownership chain is:

**Application -> Patch Graph -> ModuleContract -> Shared Controls -> Leaf Runtime/DSP**

The central rule is:

**Everything owns itself.**

A module owns its identity, state, behavior and composition. A canonical control owns its physical behavior and appearance. The graph owns routing. The runtime owns signal execution. Persistence owns reconstruction of saved project state.

No layer should recreate behavior already owned by another layer.

---

## 1. Application Layer

The application owns project lifecycle, navigation, Patch Graph state, module instances, persistence, application-level menus/selectors, Android/native integration where required, and loading shared runtime infrastructure.

It does not define individual module controls or module DSP behavior.

---

## 2. Android Host

The Android layer is the native shell around the HTML5 application. It hosts the WebView, loads application assets, and exposes explicitly supported device capabilities that cannot be provided directly by the browser runtime.

Browser-side MultiSynth code should remain independent of Android-specific behavior unless that capability is deliberately exposed through the native bridge.

---

## 3. Patch Graph

The Patch Graph is the primary composition and performance workspace.

It owns:

- module placement, movement and selection;
- board pan and zoom;
- Carrier routing;
- Clock routing;
- visible patch cables and module jacks;
- dynamic routing-jack presentation;
- persistence of graph position and connection state.

Module position has no routing meaning. Signal flow exists only through explicit connections.

The Patch Graph does not own internal module behavior or physical control interaction.

---

## 4. ModuleContract

`ModuleContract` is the canonical runtime owner and registry for modules.

A registered module has two canonical pieces: its runtime definition and its module surface.

### Runtime definition

The runtime definition may own:

- default persistent state;
- DSP/runtime construction;
- state application;
- MIDI Note On/Off handlers;
- clock handlers;
- lifecycle behavior;
- other module-specific runtime responsibilities.

Playable musical events use MIDI Note On/Off semantics. `ModuleContract` does not expose a parallel generic trigger bus.

`ModuleContract.clock()` is the explicit jack-clock path. Clock packets stay timing data and never become note events.

### Module surface

The module surface may own:

- module identity;
- semantic control descriptors;
- control grouping and bindings;
- face composition metadata;
- package/behavior metadata;
- module-specific presentation information;
- declared external routing information.

The generic module editor retrieves both pieces through `ModuleContract`.

The old Module Builder definition/catalog runtime is retired and must not be reintroduced as a parallel owner.

---

## 5. Module Ownership

A module owns the things that make it a particular instrument or processor, including identity, metadata, theme, persistent state, parameter meaning, DSP/runtime behavior, control bindings, jack policy, intentional composition, artwork, and MIDI note/clock semantics where applicable.

A module does not own generic physical controller behavior.

**The module decides what a control means. The control decides how that physical control works.**

When two modules solve the same class of problem, the established software pattern is reused wherever applicable: state shape, MIDI/event flow, timing/scheduling, lifecycle handling, editor/runtime separation, and control behavior. Instrument-specific behavior is the reason to diverge; similarity is the reason to copy the working pattern rather than invent a parallel implementation.

---

## 6. Shared Control Architecture

Recurring physical controls come from the canonical shared control system.

Current canonical families include knob, encoder, turntable, fader, ribbon, expression, pad, button, switch, XY, readout, screen, oscilloscope, meter and LED.

Jack and decal are shared node features rather than ordinary module controls.

Canonical control packages live under `app/src/main/assets/controls/`.

The aggregate public layers remain:

- `control-surface-library.js`
- `control-surface-spec.js`
- `controls/spec-core.js`
- `control-surface-renderer.js`
- `control-surface.css`

---

## 7. Canonical Control Ownership

A canonical control owns appearance, geometry, physical proportions, touch behavior, pointer capture, gesture interpretation, generic value/state I/O, pressed/active feedback, lock feedback where supported, approved variants, and control-specific accessibility semantics.

Module code may choose a supported control, bind it, theme it through supported hooks and place it in an intentional composition. Module code must not recreate canonical control anatomy or gestures.

The canonical control-family audit is complete.

---

## 8. Canon Protection

Existing canonical controls are locked.

Changes to an existing canonical control’s appearance, geometry, interaction, generic I/O, renderer behavior, shared state behavior, or existing approved variants require two explicit confirmations for that exact proposed change.

Authorization is single-use and does not authorize adjacent cleanup or unrelated refactors.

---

## 9. Control Prefabs

Reusable assemblies of canonical controls belong in `controls/prefabs.js`.

A prefab is a composition, not a second physical-control implementation.

**Canonical controls are the parts. Prefabs are reusable assemblies. Modules are the complete machines built from them.**

---

## 10. Module Interface Composition

Module faces use canonical controls plus intentional structural composition.

Shared layout owns ordinary module containment, banks, control grids, responsive reflow, common touch sizing, phone-width containment, label containment and standard semantic layout roles.

Specialized module compositions are allowed when the instrument itself requires them, but they still consume canonical controls rather than recreating them.

---

## 11. Module Editors

The shared module editor consumes runtime definitions and surfaces from `ModuleContract`.

For ordinary modules it identifies the module instance, retrieves the runtime definition and surface, reconstructs current state, mounts canonical controls, binds interaction to state, and applies state through the normal runtime path.

Specialized editors may exist for genuinely specialized instruments but do not create private control systems.

---

## 12. State and Control Binding

Module state is authoritative.

A mounted control reflects the state target to which it is currently bound. Interaction writes through the active binding into module state. External and restored state changes must be reflected back into the mounted control.

Live control movement uses the state/runtime application path. It must not structurally rebuild the audio graph.

Graph rebuilds are structural operations. Control interaction is state application.

---

## 13. Contextual Binding

One physical control may remain mounted while its semantic target changes.

Every contextual target must have a stable binding identity. When context changes, the control must fully rebind, restore the new target's visible/persistent state, direct new interaction only to the new target, and cancel transient gesture state belonging to the previous binding.

An interaction begun against one binding must never continue writing into another binding.

---

## 14. Freewheel and Test Module

The Test Module is the canonical control test harness. Freewheel lets a physical control perform its normal interaction without requiring a real module/DSP destination.

Freewheel does not create a second implementation; it exercises the real canonical behavior independently of leaf semantics.

---

## 15. Signal, MIDI and Jack Architecture

MultiSynth currently has two graph routing domains:

- **Carrier** — audio signal routing.
- **Clock** — patchable timing routing.

A **jack** is the visible patch point on a module. Direction is encoded by the graph connection contract, but the physical UI remains a jack rather than being described as a device input/output.

There is currently no general control-voltage routing domain.

Performance/control semantics are MIDI-native:

- Note On/Off — playable notes, drum hits and sample-slot events;
- Control Change — controller values;
- Pitch Bend — pitch expression;
- Channel/Poly Pressure — pressure expression;
- Program Change — program selection;
- F8/FA/FB/FC — timing and transport.

The native MIDI parser keeps these as MIDI messages rather than translating them into a CV-shaped packet vocabulary.

Clock packets use clock semantics only. A clock packet must never enter a module as a playable note event.

---

## 16. Master Timing Architecture

`PatchTransport` is the sole internal timing authority.

The internal master timebase is supplied by the AudioWorklet clock processor. `PatchTransport` converts that sample-based timebase into real MIDI realtime timing semantics:

- `F8` — Timing Clock at exactly 24 pulses per quarter note;
- `FA` — Start;
- `FB` — Continue;
- `FC` — Stop.

Modules do not create private schedulers when they need synchronization. Timing-aware modules consume the transport directly or consume named musical subdivisions derived from the same 24-PPQN stream.

A sixteenth-note boundary is derived every six `F8` pulses. Other musical divisions are derived from the same authoritative pulse count.

For internally generated timing, sequencers that need precise audio scheduling use `PatchTransport.subscribeScheduledPulse()` lookahead and schedule sound/event consequences against future AudioContext timestamps. They do not wait for a live main-thread F8 callback and then attempt to start audio at a timestamp that may already be in the past.

External MIDI clock remains live because future external F8 pulses cannot be known in advance. Internal and external MIDI timing still enter the same `PatchTransport`; downstream musical semantics remain identical even though only the internal source can be scheduled ahead.

---

## 17. Father Time

Father Time is the visible master-clock module and timing-jack bridge. It is not a second timing authority.

Its responsibilities are:

- expose the shared patch BPM control;
- reflect the master timeline visually;
- send real physical MIDI realtime clock/transport messages;
- expose patchable Clock jacks derived from the master timeline.

Father Time is always on and has no RUN state. Its rebuilt face contains the BPM encoder and MIDI CLOCK activity LED; START/CONTINUE/STOP are transport semantics, not duplicate front-panel scheduler controls.

Physical MIDI clock remains 24 PPQN. Father Time's current patch Clock jack emits one quarter-note tick derived from every 24th MIDI clock pulse.

Multiple Father Time module instances share one physical MIDI-out clock stream so module count cannot multiply physical MIDI timing.

---

## 18. Timing Followers and Playable MIDI Modules

Timing-aware modules are identified by `clockFollower` capability metadata.

Their sequencers consume the shared transport/subdivision stream directly. Patch Clock jacks are explicit timing connections and are not note/event buses.

A clock-aware module must not infer BPM by running its own timer, start a private scheduler, or reinterpret a Clock packet as a performance event.

Playable modules use `noteInput` capability metadata and `ModuleContract.noteOn()` / `noteOff()` handlers.

Whitman Sampler maps MIDI notes 36–51 to its 16 sample slots. Time Bandits maps MIDI notes 36–51 to its 16 drum voices. Both internal sequencers emit real MIDI Note On/Off into the same note-receiver path used by external MIDI instead of directly invoking private playback functions.

Whitman Sampler is the reference implementation for the shared 16-slot/32-step pattern architecture. Time Bandits copies that applicable pattern/event/timing implementation and retains only the drum-machine behavior that is genuinely instrument-specific.

RanDrone uses MIDI Note On as its explicit manual/random-event performance input.

The current timing participants include Father Time, Whitman Sampler, Time Bandits and RanDrone.

---

## 19. Dynamic Jacks and the +1 Contract

Some routing modules expose a **used + 1** jack boundary:

- all currently used jacks remain available;
- one additional unused jack is exposed;
- when that jack becomes used, another unused jack becomes available.

The dynamic-jack policy belongs to the module contract and the Patch Graph owns rendering/connection of those declared jacks.

Current examples include Alchemy dynamic Carrier jacks, Splitter/Merger dynamic Carrier routing, and Father Time dynamic Clock jacks.

---

## 20. Audio Runtime

The audio/runtime layer owns module DSP/runtime instances, applying module state, Carrier signal construction, runtime MIDI note/clock behavior, structural audio graph connections, and active AudioNode lifecycle.

Normal control movement applies state to the existing runtime. Structural routing changes may reconnect graph structure where necessary.

---

## 21. Output Ownership

Only the designated output path reaches the device audio destination.

The Output Mixer is the terminal audio path to the device speaker. Ordinary modules do not silently connect themselves directly to device output. Audio output modules are explicit members of the module/routing architecture.

Physical MIDI output is likewise explicit. `MIDIchlorian` is the terminal physical MIDI sink for ordinary MIDI channel/performance messages and module-emitted pattern MIDI. It uses the existing native MIDI bridge rather than introducing a second MIDI protocol.

Physical realtime clock/transport ownership remains separate: Father Time is the sole F8/FA/FB/FC hardware bridge. MIDIchlorian does not duplicate realtime messages, so adding a MIDI output module cannot double-clock external devices.

---

## 22. Persistence

Persistence reconstructs the playable project, not merely its drawing.

Persistent project state includes module instances, positions, module state, graph camera state, patch cables, dynamic routing state, referenced assets, meaningful presentation state, contextual binding targets, binding-associated values and persistent lock state where applicable.

The current node-graph serialization format uses explicit Carrier and Clock connections. Obsolete timing connections from the retired routing domain are not restored into the new graph format.

---

## 23. CSS Ownership

Shared CSS owns shared control and ordinary module layout infrastructure. Module CSS owns identity and intentional specialized composition.

Module CSS must not recreate canonical control anatomy or generic responsive infrastructure.

---

## 24. Standards and Verification

The standards path validates active modules against registered identity, manifest metadata, `ModuleContract` runtime definition and surface, declared capabilities, and routing/boilerplate expectations.

Timing/MIDI smoke tests must prove:

- one real 24-PPQN MIDI clock authority;
- sample-accurate internal F8 boundaries;
- identical subdivision semantics for internal and external MIDI clock;
- internally scheduled sequencers use transport lookahead rather than main-thread live-F8 audio scheduling;
- no module-local timing scheduler replaces the transport;
- clock-jack packets stay on the clock path and cannot become note events;
- Father Time cannot multiply physical MIDI clock output;
- MIDIchlorian cannot duplicate Father Time realtime clock/transport output;
- MIDI Note On/Off reaches modules through the note contract rather than a generic trigger/CV bus;
- internal sequencer events use the same real MIDI note path as external performance where applicable;
- MIDI channel messages remain MIDI channel messages.

Control verification remains separate and must not be changed as part of timing/MIDI work.

---

## 25. Legacy Architecture

The old Module Builder runtime/catalog/definition path is retired. It must not return as a compatibility registry, shadow surface registry, second runtime owner, adapter around `ModuleContract`, or fallback editor source.

Retired CV/trigger timing-routing concepts likewise stay in Git history rather than remaining as active compatibility paths.

Git history is reference material, not active architecture.

---

## 26. Architectural Direction

**Application** owns project lifecycle, navigation, persistence and host integration.

**Patch Graph** owns module instances, spatial arrangement, Carrier routing and Clock-jack routing.

**PatchTransport** owns time.

**ModuleContract** owns canonical runtime definitions and module-owned surfaces.

**Modules** own identity, state, semantics, DSP/runtime behavior and intentional composition.

**Control Prefabs** own reusable compositions built from canonical controls.

**Canonical Controls** own reusable physical hardware behavior, appearance, interaction and generic I/O.

**Leaf Runtime/DSP** owns the actual signal consequence of module state.

The guiding rule remains:

**Everything owns itself.**

Do not solve architectural disagreement by adding another compatibility layer. Move responsibility to the layer that actually owns it.
