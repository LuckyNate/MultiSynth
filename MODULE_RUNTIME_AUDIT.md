# MultiSynth Module Runtime Audit

Audit basis: canonical `ModuleIds`/`ModuleManifest`, module runtime registration files under `assets/modules`, editor faceplates, and the existing `module-test` runtime checks.

This file is intentionally a development audit, not a release filter. All canonical modules stay visible until beta.

## RUNS

These modules have a canonical manifest entry, a runtime registration path, and no currently known user-reported repair blocker in the active repair pass.

- Live Wire
- Beat Red
- Father Time
- Whitman Sampler
- Time Bandits
- The Chopper
- Sample Surgery
- Sample Library
- Big Deal
- Big Mouth
- Been Served
- Garage Band
- Master of Levels
- Denzel's Equalizer
- Echo Canyon
- Lowrider LFO
- Unstable Diffusion
- PureSynth
- QuadSynth
- Pulsynth
- SinLadder
- Razorback
- Stinger
- No Quarter
- RanDrone
- Tapeworm
- Tail Gator

## RUNS — UI / BEHAVIOR REPAIR

Runtime exists and the module is not to be removed or hidden. These remain scheduled for deeper discussion/repair rather than being treated as missing modules.

- Control Freak — runtime exists; universal keyboard/control architecture remains deferred for deeper discussion.
- Grain Liqour — runtime exists; grain-as-waveform-source behavior remains a focused repair/design target.
- Hookworm — runtime exists and basic operation was confirmed; control semantics/settings still need a later repair pass.

## NEEDS REPAIR / MISSING RUNTIME

- None currently identified among the 30 canonical modules.

## Integrity rules now enforced

1. Canonical module identity is centralized in `module-ids.js`.
2. Canonical modules remain visible during development until beta.
3. A duplicate Module Builder definition is an error rather than a silent replacement.
4. A duplicate ModuleContract/runtime definition is an error rather than a silent replacement.
5. A module that needs repair stays on the repair schedule; it is not replaced by a duplicate copy or hidden to make an audit pass.
6. `module-test.html` remains the per-module runtime/faceplate test surface.

## Next gate

Run the 30 modules through the module-test surface and convert this static classification into observed PASS / UI REPAIR / RUNTIME REPAIR results. Do not alter DSP merely to satisfy the audit.