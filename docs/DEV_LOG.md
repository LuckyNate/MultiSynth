# MultiSynth Development Log

## 2026-09-14 — Clock-only timing architecture

The former generic control-voltage routing concept has been retired from the active architecture. MultiSynth now treats timing as timing: `PatchTransport` is the sole internal clock authority, physical MIDI realtime remains F8 at 24 PPQN with FA/FB/FC transport messages, and patchable timing uses explicit Clock jacks and `clock`/`tick` packets.

The graph now has Carrier and Clock routing domains. Generic module boilerplate no longer creates control-voltage jacks on every module. Clock-aware modules declare `clockFollower`/`clockSource` capabilities, and Father Time exposes dynamic Clock jacks rather than routing timing through generic trigger packets.

`ModuleContract.clock()` is a dedicated clock path. Clock packets do not automatically invoke module trigger behavior. This closes the failure mode where Father Time timing pulses could enter Whitman Sampler through its ordinary trigger handler and multiply sequencer activity.

Father Time remains an always-on front panel for the shared transport. Physical MIDI output continues at full 24 PPQN. Its current patch Clock jack emits one quarter-note tick, derived from every 24th F8 pulse. Multiple Father Time instances share one physical MIDI clock-out subscription.

The retired routing bus was removed and replaced by `clock-bus.js`. Node graph serialization now stores explicit `clock` connections.

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
