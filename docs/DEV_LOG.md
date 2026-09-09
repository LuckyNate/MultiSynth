# MultiSynth Development Log

## 2026-09-09 — Canonical shared-control lock

The shared control library is now considered pure canon, including READOUT.

Existing canonical control appearance, geometry, interaction behavior, generic I/O behavior, renderer behavior, and readout behavior/styling are untouchable by default. Modules may consume the shared controls and use supported theme/CSS hooks without modifying canon.

A change to an existing canonical control now requires a two-step explicit authorization for that exact change: Nate first authorizes the proposed canonical change, then the exact scope is repeated back and Nate explicitly confirms it again. Only then may that one change be executed. The authorization is single-use and does not extend to cleanup, refactors, adjacent controls, styling, behavior, or related follow-up work.

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
