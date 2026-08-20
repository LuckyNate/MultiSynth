# MultiSynth Running Progress Report

This file records current implementation status against `docs/MULTISYNTH_SPEC.md`.

Status labels:

- **SPECIFIED** — intended behavior is defined.
- **IMPLEMENTED** — code exists for the intended behavior.
- **VERIFIED** — behavior has been exercised successfully.
- **BROKEN** — known not to work as intended.
- **PARTIAL** — some required behavior exists, but the specification is not fully met.
- **LOCKED** — stable; do not alter unless fixing an observed malfunction.

## Architecture

- Explicit freeform Node Graph external routing — **IMPLEMENTED**.
- Saved racks as reusable compound nodes with ordered internal chains — **IMPLEMENTED**.
- Spatial/cascade routing as current architecture — **REMOVED / NOT CURRENT**.
- Canonical architecture documentation — **UPDATED** to explicit node graph.

## Timing and control

- Father Time as top-level timer/CV authority — **SPECIFIED**; downstream propagation requires focused verification.
- CV as persistent downstream parent timing/control signal — **SPECIFIED**; verify runtime propagation end-to-end.
- DV as temporary child CV that does not modify parent CV and does not persist graph-wide — **SPECIFIED**; runtime behavior requires focused verification.
- Time Bandits upstream-clock following with internal fallback clock — **IMPLEMENTED** in runtime.
- Time Bandits probability drum hit behavior — **IMPLEMENTED** in runtime.
- Time Bandits DV emission — **IMPLEMENTED** in runtime.
- Stale `onDiv` compatibility alias in Time Bandits — **REMOVED**.

## Module metadata alignment

- Time Bandits category changed from clock-first to rhythm — **IMPLEMENTED**.
- Unstable Diffusion manifest now declares audio input and processor/fallback-generator intent — **IMPLEMENTED metadata only**.
- Remaining manifest/runtime capability audit against canonical module jobs — **TODO**.

## Known module status

### LOCKED / stable

- No Quarter — **LOCKED**; reported working. Do not touch unless malfunction is observed.
- QuadSynth — **LOCKED**; reported working. Do not touch unless malfunction is observed.

### Broken / incomplete

- Big Mouth — **BROKEN/PARTIAL**. Mic input was reportedly repaired, but speech recording still failed in last test; reverse-vocoder behavior is therefore unverified.
- Unstable Diffusion — **PARTIAL**. Current runtime generates seeded/noise-derived synthesis but does not yet implement its specified primary behavior of resolving from live upstream audio with white-noise fallback.

### Requires targeted verification

- Father Time downstream timer/CV authority through loose modules and rack nodes.
- DV locality/non-persistence and preservation of parent CV downstream.
- Control Freak node-input configuration of keyboard/knobs/dials/shared controls.
- Whitman Sampler microphone capture, synth-input capture, sample-library access, sequencing, and persistence.
- The Chopper automatic sound detection, chopping, keep-selection, and save-to-library path.
- Sample Surgery save/delete/library mutation behavior.
- Sample Library sorting/handling behavior.
- Time Bandits stacked-rack probability drum-machine behavior.
- RanDrone single random event per CV/DV click.
- Hookworm granular echo-loop behavior.
- Tapeworm tape-loop echo behavior.
- Tail Gator Bluetooth blocking vs Tailgate Mode behavior.

## Documentation and maintenance

- `docs/MULTISYNTH_SPEC.md` — **CREATED** as canonical running spec.
- `docs/MULTISYNTH_PROGRESS.md` — **CREATED** as running implementation report.
- `docs/MULTISYNTH_TODO.md` — **CREATED** for actionable alignment work.
- `docs/RACK_ARCHITECTURE.md` — **UPDATED** to remove obsolete spatial routing contract.

## Current next actions

1. Trace the actual DV routing/bus implementation and verify it matches temporary child-CV semantics.
2. Trace Father Time propagation through node edges and rack-contained modules.
3. Implement Unstable Diffusion live upstream-audio input analysis/resynthesis with white-noise fallback, preserving its existing playable fallback behavior.
4. Repair Big Mouth recording path and validate reverse-vocoder behavior.
5. Audit remaining manifest capabilities/categories against the canonical module jobs.
6. Run module-by-module regression verification without touching LOCKED modules unless a fault is observed.
