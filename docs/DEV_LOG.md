# MultiSynth Development Log

## 2026-09-09 — Control lab → canon promotion workflow

New shared controls are now developed outside the locked canonical library first. Experimental control implementations are development-only and may be consumed by Test Module/development tooling, but production modules must never depend on them.

When a control is approved, promotion is one cleanup-complete operation: move the final implementation into `control-surface-library.js`, switch Test Module to the canonical `ControlSurface` API, remove the temporary implementation/include/namespace/adapters, search for leftover references, and delete the lab file if it is empty. Promotion must leave one implementation and one intended canonical API rather than development scaffolding or compatibility debris.

The complete build-specific workflow is recorded in `docs/CONTROL_DEVELOPMENT.md`. After promotion, the normal canonical shared-control lock applies.

## 2026-09-09 — Canonical shared-control lock

The shared control library is now considered pure canon, including READOUT.

Existing canonical control appearance, geometry, interaction behavior, generic I/O behavior, renderer behavior, and readout behavior/styling are untouchable by default. Modules may consume the shared controls and use supported theme/CSS hooks without modifying canon.

A change to an existing canonical control now requires a two-step explicit authorization for that exact change: Nate first authorizes the proposed canonical change, then the exact scope is repeated back and Nate explicitly confirms it again. Only then may that one change be executed. The authorization is single-use and does not extend to cleanup, refactors, adjacent controls, styling, behavior, or related follow-up work.

READOUT now lives directly in `control-surface-library.js` with the other canonical controls. The former standalone `fourteen-segment-readout.js` was a development-only split and has been removed. Its approved masks, segment geometry, lit/unlit styling, scrolling behavior, value routing, and module-local scope were moved intact; this structural move does not reopen READOUT canon for modification.

## 2026-09-01 — Live-control audio rebuild regression

A crackling regression was traced to live control handlers calling `NodeAudioGraph.rebuild()` while knobs/dials were moving. Rebuilding the graph during continuous interaction tears down/reconnects audio repeatedly and is not a valid parameter-update path.

Rule established and documented in `docs/DESIGN.md`: live controls update canonical module state and the existing DSP runtime only. `NodeAudioGraph.rebuild()` is structural-only and must not be called from knob, dial, fader, ribbon, pad/step-drag, or other continuous control/performance movement.

Corrected paths:

- shared instrument editor;
- Beat Red editor;
- Big Deal editor;
- Grain Liqour editor;
- No Quarter UI.

The rule is also commented beside the affected live-update code paths to prevent recurrence.
