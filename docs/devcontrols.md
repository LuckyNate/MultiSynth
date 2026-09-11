# MultiSynth Control Developer Guide

## Purpose

The shared control system separates physical controller behavior from module leaf behavior. Canonical controls own their appearance, interaction and generic I/O. A module owns only what a control connects to and what its value means.

## Load chain

The canonical runtime chain is:

1. `control-surface-library.js` — control vocabulary, descriptor contract, gestures/actions and generic I/O.
2. `control-surface-spec.js` — parser-time router that loads the individual `controls/*.js` definitions.
3. `controls/spec-core.js` — validates and assembles those definitions into `MultiSynth.ControlSurfaceSpec`.
4. `control-surface-renderer.js` — renders canonical anatomy and owns shared interaction/binding behavior.
5. `control-surface.css` — imports the individual `controls/*.css` files.

The individual control files are the canonical per-control packages. Do not recreate their anatomy or physical interaction in a module.

## Canonical module controls

The module-control set is knob, encoder, turntable, fader, ribbon, expression, pad, button, switch, XY, readout, screen, oscilloscope, meter and LED.

Jack and decal are node features. They share the rendering system but must not be classified as module controls.

## Descriptors

A control is described by its control type plus optional `id`, `state`, `label`, `variant`, `value`, gesture bindings and metadata. Use `ControlSurface.define()`/the existing module descriptor path rather than inventing private control structures.

`value` carries the physical value contract such as default, minimum, maximum and step. `state` identifies the module-state field represented by the control. Visual variants are resolved by `ControlSurfaceSpec`; modules may select an approved variant but may not redefine canonical anatomy.

## Rendering and mounting

Use `MultiSynth.ControlSurfaceRenderer.mount(parent, descriptor, options)` to create a control. `render()` may be used when the caller needs the node before insertion.

Use renderer APIs to reflect state into the control. Do not reach into shared pointer, thumb, track, lens, marker or face elements from module code to reproduce physical behavior.

## State and binding

Physical interaction changes the current binding. The binding then writes to canonical module state through the normal module-state/runtime path. Live interaction must never call `NodeAudioGraph.rebuild()`; graph rebuilds are structural only.

When state is changed externally or restored from persistence, reflect it back into the mounted control through the shared renderer/binding API.

Knob lock state is persistent state when a module exposes it. Lock state belongs to the current binding, not to an unrelated hidden controller context.

## Contextual controls

A physical control may remain mounted while its semantic target changes. Give each target a stable binding identity. On rebind:

- read the new target from module state;
- refresh every persistent property represented by the control;
- update the visible value and lock/state feedback immediately;
- direct subsequent interaction to the new target;
- discard transient interaction state from the old target.

The controller must not infer module context by inspecting unrelated application state.

## Freewheel / Test Module

The Test Module mounts the same canonical controls in freewheel mode so their gestures can be exercised without a real audio or module target. Freewheel is a controller test harness, not a second implementation of controller appearance.

A freewheeling control may move, toggle, press or return exactly as its physical control is designed to do while intentionally producing no leaf/DSP effect.

## Ownership rule

Controller code owns:

- appearance and geometry;
- physical gesture interpretation;
- generic value/state I/O;
- shared feedback and approved variants.

Module leaf code owns:

- the state field or contextual binding represented;
- the semantic meaning of the value;
- module-specific action after a canonical event/value change;
- DSP/runtime application of that state.

Module code must not paint canonical pointers/thumbs/tracks itself or install a replacement drag/tap implementation for a canonical control.

## Verification

A control is not complete merely because it mounts. Interactive controls require smoke coverage of their advertised physical interaction and resulting generic state/event behavior. Display-only controls require mount/state-reflection coverage.

The ownership audit should also reject private module implementations of canonical control anatomy or interaction.

## Canon lock

The shared library, spec and renderer are protected canon. Changes to existing canonical control appearance, interaction, generic I/O or readout behavior require the repository's two explicit confirmations for the exact proposed change before execution.
