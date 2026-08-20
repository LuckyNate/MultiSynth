# MultiSynth Alignment TODO

This file tracks confirmed gaps between the current implementation and the canonical product behavior agreed for the node-graph architecture.

## Timing and control

- [ ] Verify DV is implemented as a temporary child-CV timing branch: it may provide divided or multiplied local timing, must not modify the parent CV, and must not persist farther through the graph than the local DV consumer relationship requires.
- [ ] Verify Father Time establishes timer/CV authority for every reachable downstream node, including modules contained inside downstream rack nodes.
- [ ] Verify Time Bandits follows upstream timing when present and uses its internal clock only as fallback.
- [ ] Remove remaining stale DIV-era aliases or terminology from live code. Current terminology is CV and DV only.

## Module alignment

- [ ] Unstable Diffusion: accept live upstream audio as its primary source; resolve a waveform from that input; when no upstream audio is present, use its internal white-noise voice as fallback source/carrier.
- [ ] Unstable Diffusion: align manifest/runtime capabilities with processor + fallback-generator behavior.
- [ ] Big Mouth: repair and verify speech recording, then verify recorded speech/formant extraction drives the intended reverse-vocoder behavior.
- [ ] Time Bandits: classify/document it primarily as a probability drum module while retaining clock follower/source fallback, CV passthrough, and DV sourcing behavior.
- [ ] Verify Sample Library remains a file/library management utility rather than being treated as an audio-output source.
- [ ] Verify Control Freak node-input configuration correctly maps its keyboard, knobs, dials, and shared controls.

## Documentation and architecture

- [ ] Replace or retire stale rack/spatial-routing documentation that contradicts the explicit node-graph architecture.
- [ ] Maintain a canonical running spec for current architecture, signal semantics, module jobs, and invariants.
- [ ] Maintain a running progress report separating specified, implemented, verified, broken, and deferred work.

## Stable modules / regression guard

- [ ] Do not change No Quarter unless fixing an observed malfunction.
- [ ] Do not change QuadSynth unless fixing an observed malfunction.
- [ ] Run module-by-module verification after architecture/metadata alignment; do not combine unrelated DSP or UI changes with cleanup.
