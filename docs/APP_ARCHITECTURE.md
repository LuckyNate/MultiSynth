# MultiSynth App Architecture

## Purpose

MultiSynth is a phone-first Android-hosted HTML5 modular synthesizer and audio workstation.

The current architecture is organized around a simple ownership chain:

**Application -> Patch Graph -> ModuleContract -> Shared Controls -> Leaf Runtime/DSP**

Each layer owns a specific job.

The central rule is:

**Everything owns itself.**

A module owns its identity, state, behavior and composition.  
A canonical control owns its own physical behavior and appearance.  
The graph owns routing.  
The runtime owns signal execution.  
Persistence owns reconstruction of saved project state.

No layer should recreate behavior already owned by another layer.

---

## 1. Application Layer

The application owns the overall project environment.

Its responsibilities include:

- project lifecycle;
- navigation;
- Patch Graph state;
- module instances;
- persistence;
- application-level menus and selectors;
- Android/native integration where required;
- loading the shared runtime infrastructure.

The application does not define individual module controls or module DSP behavior.

---

## 2. Android Host

The Android layer is the native shell around the HTML5 application.

Its responsibilities are limited to:

- hosting the WebView;
- loading application assets;
- exposing explicitly supported native capabilities;
- device integration that cannot be provided directly by the browser runtime.

Browser-side MultiSynth code should remain independent of Android-specific behavior unless that capability is deliberately exposed through the native bridge.

---

## 3. Patch Graph

The Patch Graph is the primary composition and performance workspace.

It contains complete module instances.

Its responsibilities include:

- module placement;
- module movement and selection;
- board pan and zoom;
- Carrier routing;
- CV routing;
- visible patch cables;
- module external ports;
- dynamic routing-port presentation;
- persistence of graph position and connection state.

Module position has no routing meaning.

Signal flow exists only through explicit connections.

The Patch Graph does not own internal module behavior or physical control interaction.

---

## 4. ModuleContract

`ModuleContract` is the canonical runtime owner and registry for modules.

The previous Module Builder definition/catalog runtime has been removed from the active architecture.

A module registered with `ModuleContract` has two related canonical pieces:

### Runtime definition

The runtime definition describes what the module does.

It may own:

- default persistent state;
- DSP/runtime construction;
- state application;
- note handlers;
- clock handlers;
- CV behavior;
- trigger behavior;
- lifecycle behavior;
- other module-specific runtime responsibilities.

### Module surface

The module surface describes how the module exposes itself to the shared UI/control system.

It may own:

- module identity;
- semantic control descriptors;
- control grouping;
- control bindings;
- face composition metadata;
- package/behavior metadata;
- module-specific presentation information;
- declared external routing information.

The generic module editor retrieves both pieces through `ModuleContract`.

A finished module should therefore have one authoritative contract rather than parallel Module Builder, editor and runtime definitions.

The standards audit also treats `ModuleContract` runtime definitions and surfaces as the authoritative module registration.

---

## 5. Module Ownership

A module owns the things that make it a particular instrument or processor.

That includes:

- identity;
- metadata;
- four-color theme;
- persistent state;
- semantic parameter meaning;
- runtime/DSP behavior;
- control bindings;
- external port policy;
- intentional face composition;
- module-specific artwork and presentation;
- note, clock, CV and trigger semantics where applicable.

A module does not own generic physical controller behavior.

The intended leaf-level rule is:

**The module decides what a control means.  
The control decides how that physical control works.**

Working leaf behavior should remain isolated from shared controller implementation.

---

## 6. Shared Control Architecture

All recurring physical controls come from the canonical shared control system.

Current canonical families include:

- knob;
- encoder;
- turntable;
- fader;
- ribbon;
- expression;
- pad;
- button;
- switch;
- XY;
- readout;
- screen;
- oscilloscope;
- meter;
- LED.

Jack and decal are shared node features rather than ordinary module controls.

Canonical control packages live under:

`app/src/main/assets/controls/`

Each control package owns its own control-specific implementation and styling.

The aggregate public layers remain:

- `control-surface-library.js`
- `control-surface-spec.js`
- `controls/spec-core.js`
- `control-surface-renderer.js`
- `control-surface.css`

These are public routing, assembly and shared-runtime layers around the individual canonical control packages.

---

## 7. Canonical Control Ownership

A canonical control owns:

- appearance;
- geometry;
- physical proportions;
- touch behavior;
- pointer capture;
- gesture interpretation;
- generic value/state I/O;
- pressed/active feedback;
- lock feedback where supported;
- approved variants;
- control-specific accessibility semantics.

Module code may choose a supported control, bind it, theme it through supported hooks and place it in an intentional composition.

Module code must not recreate:

- knob pointers;
- fader thumbs;
- ribbon tracks;
- switch mechanisms;
- pad behavior;
- turntable scratch behavior;
- XY interaction;
- screen hardware;
- meter hardware;
- other canonical control anatomy or gestures.

The complete canonical control-family audit has been completed.

Control migration is no longer the current architectural phase.

---

## 8. Canon Protection

Existing canonical controls are locked.

Changes to an existing canonical control’s:

- appearance;
- geometry;
- interaction;
- generic I/O;
- renderer behavior;
- shared state behavior;
- existing approved variants

require two explicit confirmations for that exact proposed change.

Authorization is single-use.

Approval to change one control or one canonical layer does not authorize:

- cleanup;
- adjacent controls;
- refactors;
- styling changes;
- renderer changes;
- unrelated behavior;
- other follow-up work.

New control types and explicitly approved new variants may be developed separately without silently altering existing canon.

---

## 9. Control Prefabs

Reusable assemblies of existing canonical controls belong in:

`controls/prefabs.js`

A prefab is a composition, not a new physical control implementation.

Prefabs exist for recurring higher-level hardware arrangements that can be built from canonical controls.

A prefab may define:

- a reusable arrangement;
- coordinated descriptors;
- composition rules;
- common semantic grouping.

A prefab must not duplicate the internal anatomy or gesture implementation of the controls it contains.

The rule is:

**Canonical controls are the parts.  
Prefabs are reusable assemblies of those parts.  
Modules are the complete machines built from them.**

---

## 10. Module Interface Composition

Module faces use canonical controls plus intentional structural composition.

Ordinary layout belongs to the shared control-surface layout system.

Shared layout owns:

- module containment;
- banks;
- control grids;
- responsive reflow;
- common touch sizing;
- phone-width containment;
- label containment;
- standard semantic layout roles.

Module-specific layout should describe musical structure rather than repair generic layout failures.

Modules may deliberately use specialized compositions when the instrument itself requires them, including:

- mixer channel strips;
- performance keyboards;
- turntables;
- large XY surfaces;
- specialized sequencers;
- other purpose-built performance faces.

A genuine instrument-specific composition is allowed.

Reimplementing canonical physical controls inside that composition is not.

---

## 11. Module Editors

The shared module editor consumes module definitions and surfaces from `ModuleContract`.

It does not depend on the removed Module Builder definition registry.

For ordinary modules, the editor:

1. identifies the current module instance;
2. retrieves its runtime definition from `ModuleContract`;
3. retrieves its module surface from `ModuleContract`;
4. reconstructs current state from defaults plus saved instance state;
5. mounts the declared canonical controls;
6. binds interaction back to module state;
7. applies state through the normal runtime path.

Specialized modules may use purpose-built editors when their physical design genuinely requires one.

Those editors still consume canonical controls rather than creating a private control system.

---

## 12. State and Control Binding

Module state is authoritative.

A mounted control reflects the state target to which it is currently bound.

Interaction writes through the active binding into module state.

External state changes and restored persistent state must be reflected back into the mounted control.

Live control movement must use the normal state/runtime application path.

It must not structurally rebuild the audio graph merely because a knob, fader, ribbon or other live controller moved.

Graph rebuilds are structural operations.

Control interaction is state application.

---

## 13. Contextual Binding

One physical control may remain mounted while its semantic target changes.

This is a first-class supported architecture.

Every contextual target must have a stable binding identity.

When the context changes, the control must:

- stop representing the old target;
- bind to the new target;
- read the new target from module state;
- redraw its visible value;
- redraw every persistent property represented by the control;
- restore binding-specific lock state where applicable;
- direct new interaction only to the new target;
- cancel transient gesture state belonging to the old target.

An interaction started against one binding must never continue writing into another binding after a context change.

Temporary pointer/drag state is not persistent module state.

Binding-associated values and persistent controller properties are.

---

## 14. Freewheel and Test Module

The Test Module is the canonical control test harness.

It exercises the real canonical controls in freewheel mode.

Freewheel means a physical control may:

- move;
- turn;
- press;
- hold;
- release;
- toggle;
- return;
- scrub;
- otherwise perform its normal canonical interaction

without requiring a real module/DSP destination.

Freewheel does not create a second control implementation.

It exists specifically so the canonical physical behavior can be tested independently of leaf semantics.

Runtime smoke coverage should exercise the actual shared control/runtime path wherever practical.

---

## 15. Signal Architecture

Carrier and CV are distinct routing domains.

The graph/runtime is responsible for connecting declared ports.

Modules declare what routing boundaries they expose.

Ordinary static ports may include:

- Carrier IN;
- CV IN;
- Carrier OUT;
- CV OUT.

Specialized modules may expose different or additional declared ports when their function requires them.

A module does not silently connect itself to another module or to device output.

Routing is explicit.

---

## 16. Dynamic Ports and the +1 Contract

MultiSynth supports dynamic routing-port contracts.

Some routing modules expose a **used + 1** boundary:

- all currently used ports remain available;
- one additional unused port is exposed;
- when that port becomes used, another unused port becomes available.

This allows routing capacity to grow naturally without presenting a large fixed bank of empty jacks.

The dynamic port policy belongs to the module contract.

The Patch Graph/runtime owns rendering and connecting the ports described by that contract.

Dynamic-port metadata must survive the contract/graph path intact.

Current examples include:

- Alchemy +1 dynamic Carrier inputs;
- Splitter +1 routing;
- Merger +1 routing;
- Father Time +1 CV outputs.

Dynamic ports are therefore part of the normal routing architecture rather than special editor-only UI.

---

## 17. Routing Utility Modules

Routing behavior may itself be represented by complete modules.

Splitter and Merger are examples.

They use the same module architecture as other finished modules:

- registered identity;
- `ModuleContract` runtime definition;
- `ModuleContract` surface;
- declared routing contract;
- canonical/shared presentation infrastructure.

They are not graph-internal exceptions masquerading as modules.

---

## 18. Audio Runtime

The audio/runtime layer owns signal execution.

Its responsibilities include:

- module DSP/runtime instances;
- applying module state;
- Carrier signal construction;
- CV behavior;
- runtime clock/note behavior;
- structural audio graph connections;
- lifecycle of active audio nodes.

Normal physical controller movement applies state to the existing runtime.

Structural routing changes may rebuild or reconnect graph structure where necessary.

The two operations must not be confused.

---

## 19. Output Ownership

Only the designated output path reaches the device audio destination.

Ordinary modules do not silently connect themselves directly to the device output.

Output modules are explicit members of the module/routing architecture.

The final destination remains controlled and identifiable.

---

## 20. Persistence

Normal work must persist.

Persistence should reconstruct the playable project, not merely its drawing.

Persistent project state includes, where applicable:

- module instances;
- module positions;
- module state;
- Patch Graph camera state;
- patch cables;
- dynamic routing state;
- referenced assets;
- meaningful presentation state;
- contextual binding targets;
- binding-associated parameter values;
- persistent lock/unlock state;
- other module-owned persistent properties.

After reload, switching among contexts must reproduce the same control values and persistent controller states that existed before reload.

---

## 21. CSS Ownership

Shared CSS reinforces the same ownership boundaries as runtime code.

`control-surface.css` and the individual canonical control styles own shared control and ordinary module layout infrastructure.

Module CSS owns identity and intentional composition.

Module CSS may own:

- colors;
- faceplate/chassis material;
- typography;
- decoration;
- intentional specialized composition;
- supported thematic treatment.

Module CSS should not recreate canonical control anatomy or generic responsive infrastructure.

Horizontal overflow on a normal phone module face is a layout failure.

---

## 22. Standards and Verification

A valid active module should have the pieces required by the current runtime architecture.

The standards path validates active modules against:

- registered module identity;
- manifest metadata;
- `ModuleContract` runtime definition;
- `ModuleContract` module surface;
- declared capabilities;
- routing/boilerplate expectations where applicable.

Obsolete Module Builder definitions are no longer part of this validation path.

Control verification should test both:

- physical control behavior;
- resulting generic state/event behavior.

Display-only controls require correct mounting and state reflection.

The architecture audit should reject private module implementations of canonical control anatomy or interaction.

---

## 23. Current Architectural Priority

The canonical control-family completeness/modularity audit is complete.

The current priority is the state/binding boundary.

### First: rebind and state reflection

Verify that contextual controls completely rebind when context changes.

This includes:

- correct target identity;
- correct value;
- correct persistent lock/state feedback;
- no transient interaction leakage;
- writes reaching only the active target.

### Second: persistence and reload

Verify that contextual binding state survives save/reload.

Reload must reconstruct:

- values;
- binding identity;
- lock/unlock state where applicable;
- other persistent contextual properties.

Switching context after reload should produce the same visible and behavioral state as before reload.

These are now correctness requirements of the module/control boundary.

---

## 24. Legacy Architecture

The old Module Builder runtime/catalog/definition path is retired.

It must not be reintroduced as:

- a compatibility registry;
- a shadow module surface registry;
- a second runtime-definition owner;
- an adapter around `ModuleContract`;
- a fallback editor source.

Useful ideas or historical implementations may remain available in Git history as reference.

Git history is not active architecture.

When old implementation and the current `ModuleContract` architecture disagree, the current architecture wins unless deliberately changed.

---

## 25. Architectural Direction

The intended structure is now:

**Application**  
owns project lifecycle, navigation, persistence and host integration.

**Patch Graph**  
owns complete module instances, spatial arrangement and explicit routing.

**ModuleContract**  
owns canonical runtime definitions and module-owned surfaces.

**Modules**  
own identity, state, semantics, DSP/runtime behavior and intentional composition.

**Control Prefabs**  
own reusable compositions built from existing canonical controls.

**Canonical Controls**  
own reusable physical hardware behavior, appearance, interaction and generic I/O.

**Leaf Runtime/DSP**  
owns the actual meaning and signal consequence of module state.

The guiding rule remains:

**Everything owns itself.**

Do not solve architectural disagreement by adding another compatibility layer.

Move responsibility to the layer that actually owns it.
