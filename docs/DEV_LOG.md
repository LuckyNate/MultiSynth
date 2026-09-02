# MultiSynth Development Log

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
