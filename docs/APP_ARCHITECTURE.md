# MultiSynth App Architecture

## Purpose

MultiSynth is a phone-first Android-hosted HTML5 modular synthesizer and audio workstation.

The architecture is built around one central rule:

**Patch Graph -> Modules -> Shared Control Library**

Each layer has a distinct responsibility. Shared infrastructure must remain shared, and module-specific behavior must stay at the leaf level.

## 1. Application Layers

### Android Host

The Android layer provides the native shell around the HTML5 application.

Its job is to host the WebView, provide native capabilities where required, expose supported device services, and load the application assets.

The browser-side application should not depend on Android-specific behavior unless that behavior is intentionally exposed through a native bridge.

### Patch Graph

The Patch Graph is the main performance and composition workspace.

It contains complete module instances only.

Responsibilities include:

- module placement
- module movement and selection
- board pan and zoom
- Carrier and CV cable routing
- external module ports
- persistence of module positions and patch state

Module position has no routing meaning. Signal flow exists only through explicit patch connections.

### Module Builder

The Module Builder is a separate construction environment.

It contains primitives only, including DSP primitives and shared interface controls.

Its output is a complete module definition containing identity, state, circuit, control bindings, face composition, ports, runtime behavior, and persistence information.

Finished modules belong on the Patch Graph. Primitives belong in the Module Builder. The two node types do not mix.

## 2. Module Architecture

Each finished module is a complete instrument or processor.

A module owns:

- identity and metadata
- four-color theme
- persistent state
- DSP/runtime implementation
- control bindings
- external Carrier/CV ports
- module-specific face composition
- module-specific artwork and presentation

A module does not own generic control behavior or generic control anatomy.

The intended end state is that module code mainly defines:

**what a control connects to and what its value means**

rather than reimplementing how the control itself works.

## 3. Shared Control Architecture

All recurring controls come from the canonical shared control system.

Examples include:

- knob
- encoder
- turntable
- fader
- ribbon
- expression
- pad
- button
- switch
- XY
- readout
- screen
- oscilloscope
- meter
- LED
- jack
- decal

Each control is now modularized under:

`app/src/main/assets/controls/`

Each control package has its own definition and style file.

The aggregate public entry points remain:

- `control-surface-library.js`
- `control-surface-spec.js`
- `control-surface-renderer.js`
- `control-surface.css`

The large spec and CSS files now act as routing/aggregation layers instead of directly owning every individual control definition.

### Control Ownership

A canonical control type should own:

- its appearance
- its geometry
- its interaction behavior
- its generic I/O contract
- its supported variants

Module code may theme and place controls but should not recreate them.

## 4. Control Layers

### `control-surface-library.js`

Owns the shared control contract, control types, gestures, actions, generic semantics, and shared I/O behavior.

### `control-surface-spec.js`

Acts as the public visual/spec loader and exposes the canonical `ControlSurfaceSpec` API.

Individual control descriptors live in the per-control files under `assets/controls/`.

### `control-surface-renderer.js`

Owns control rendering, interaction wiring, value painting, binding helpers, and shared runtime behavior.

### `control-surface.css`

Acts as the shared stylesheet entry point.

It imports:

- shared base control CSS
- per-control CSS files
- shared layout CSS

Control-specific styling should live with that control.

## 5. Shared Layout

Shared module layout belongs to the control-surface system, not to individual modules.

Shared layout owns:

- module shell containment
- banks
- control grids
- responsive behavior
- phone reflow
- control containment
- common touch sizing
- common label behavior

Modules may define intentional composition and visual identity, but ordinary layout repair should not be duplicated locally.

## 6. Theme System

Each module has a four-color semantic theme:

- background
- panel
- accent
- text

Controls remain canonical while rendering through the owning module's theme.

The control is shared.

The surrounding instrument identity belongs to the module.

## 7. Runtime and Signal Architecture

Carrier and CV are distinct signal types.

Modules expose standard external boundaries unless explicitly specialized:

- Carrier IN
- CV IN
- Carrier OUT
- CV OUT

Only the designated final output path reaches the device audio destination.

Ordinary modules must not silently connect themselves directly to output.

Controls modify module state or runtime behavior through explicit bindings.

## 8. Binding Model

A physical control may sometimes remain mounted while its semantic target changes.

Those controls require stable binding identities.

The intended contract is:

- binding selects the current saved-state target
- context change rebinds the same physical control
- the control fully redraws from the new target state
- interaction writes through to the currently bound state
- temporary interaction state must not leak between bindings
- persistent binding state must survive reload

## 9. Persistence

Normal work should persist automatically.

Persistence should reconstruct the actual playable project state, including:

- module instances
- module positions
- module state
- Patch Graph camera state
- patch cables
- saved module definitions
- referenced assets
- meaningful presentation state
- contextual binding state where applicable

Reload should restore the same instrument, not merely the same visual arrangement.

## 10. Canon Protection

Canonical shared controls are protected.

Changes to an existing canonical control require explicit approval for the exact change and a second confirmation of that exact scope before implementation.

Approval is single-use.

Changing one control does not authorize changes to adjacent controls, shared cleanup, refactors, renderer behavior, styling, or unrelated architecture.

The modularized control files are intended to reduce blast radius so work on one control remains isolated from others.

## 11. Current Architectural Priority

The current priority is:

**Final Control Audit — Completeness + Modularity**

Each migrated control package must be checked for:

- complete ownership
- correct file boundaries
- no duplicated anatomy elsewhere
- no missing control-specific styles
- no missing control-specific definition data
- correct interaction ownership
- correct generic I/O ownership
- correct variant ownership
- clean dependency boundaries
- no unnecessary coupling to unrelated controls

After that, work continues into contextual binding, state reflection, persistence, controller ownership verification, and final module mapping.

## 12. Architectural Direction

The intended final structure is simple:

**Application**
owns navigation, project state, Patch Graph, persistence, and native integration.

**Modules**
own instrument identity, DSP, state, composition, and semantic bindings.

**Shared Controls**
own reusable hardware behavior, appearance, interaction, and generic I/O.

**Leaf Implementations**
own only what each control means inside a specific module.

That separation is the primary architecture rule for the project.
