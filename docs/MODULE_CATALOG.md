# MultiSynth Module Catalog

This is the explicit restart module inventory. These are finished product modules, not Module Builder primitives. Each is rebuilt from low-level primitives, saved as one module definition, and appears as one module node on the Patch Graph.

`main` is the salvage reference for module behavior, DSP, state, themes, layouts and useful interaction work. `alt` is the salvage reference only for low-level primitives.

## Instruments and sound sources

- **PureSynth** — pure waveform/noise synthesizer; black/white precision identity.
- **QuadSynth** — four-layer additive synthesizer; amber/gold identity.
- **Pulsynth** — pulse/PWM ladder synthesizer; vivid green identity.
- **SinLadder** — sine-ladder synthesizer; cyan laboratory identity.
- **Razorback** — triangle/saw ladder with tunable peak behavior; red/black industrial identity.
- **Stinger** — click/transient synthesis ladder using accelerating ramps; yellow/black identity.
- **No Quarter** — Rhodes-inspired electric-piano synthesizer extending beyond a conventional Rhodes; blue/silver identity.
- **RanDrone** — randomized drone/event generator; CV/DV timing can trigger discrete randomized events.
- **Grain Liqour** — grain-synthesis instrument using saved grains as source/click material. Preserve the historical spelling unless deliberately renamed.

## Rhythm, timing and control

- **Beat Red** — drum machine; preserve real rhythm behavior and strong red identity.
- **Father Time** — primary timing/CV authority; aged brown/brass clock-hardware identity.
- **Time Bandits** — probability drum/randomizer voice; follows upstream timing or appropriate internal timing and can derive divided/multiplied timing behavior.
- **LOWRIDER LFO** — low-frequency oscillator/control source; strong gold identity.
- **Control Freak** — configurable performance/controller module using keyboard, knobs, dials and other shared control surfaces.

## Sampling, recording and editing

- **Live Wire** — YouTube-oriented sampler/source module; preserve viable source/sampling behavior without obsolete wrappers.
- **WS** — sampler/sequencer supporting supplied/captured material, sequencing and shared sample-library use.
- **The Chopper** — recorder/editor that detects sounds, chops recordings and saves selected chops.
- **Sample Surgery** — sample editor and sample-library management module.
- **Sample Library** — shared sample/file library utility with stable reusable sample identity.
- **Big Deal** — granular sample-manipulation module using the project's "cards in a deck" interaction concept.

## Processing and effects

- **Big Mouth** — reverse-vocoder/formant processor. Historical implementation was incomplete/broken; rebuild the intended effect and do not call it migrated until it works.
- **Been Served** — complete patchable ADSR envelope module. This is distinct from the low-level envelope primitive used inside the Module Builder.
- **Garage Band** — band-pass filter module.
- **Master of Levels** — central patchable level/gain control.
- **Denzel's Equalizer** — equalizer module.
- **Echo Canyon** — echo/environment simulator with closed/open-space character, wet/dry, reflections and distance behavior.
- **Unstable Diffusion** — waveform-resolution/resynthesis processor using incoming audio and the historical white-noise fallback where appropriate.
- **Hookworm** — granular echo looper with its own distinct loop-machine identity.
- **Tapeworm** — tape-loop recorder/echo, distinct from Hookworm.

## Routing and output

- **Output Mixer** — final output mixer and sole normal owner of device audio output. Visible inputs always equal currently used inputs plus one spare.
- **Tail Gator** — Bluetooth/car-audio routing module; preserve only behavior that can be implemented honestly on the target platform.
- **Bluetooth Output** — Bluetooth-oriented output module. Recover its exact historical relationship to Tail Gator from `main` before deciding whether their responsibilities change.

## Explicit catalog

1. Live Wire
2. Beat Red
3. Father Time
4. WS
5. Time Bandits
6. The Chopper
7. Sample Surgery
8. Sample Library
9. Big Deal
10. Big Mouth
11. Grain Liqour
12. Been Served
13. Garage Band
14. Master of Levels
15. Denzel's Equalizer
16. Echo Canyon
17. Control Freak
18. LOWRIDER LFO
19. Unstable Diffusion
20. PureSynth
21. QuadSynth
22. Pulsynth
23. SinLadder
24. Razorback
25. Stinger
26. No Quarter
27. RanDrone
28. Hookworm
29. Tapeworm
30. Tail Gator
31. Bluetooth Output
32. Output Mixer

The first 31 are the historical active product/catalog identities recovered from `main`. Output Mixer is explicitly added to the restart catalog because it is required graph infrastructure and a visible complete module.

## Migration status

Every module eventually carries one truthful status:

- `reference` — legacy source/design exists but has not been rebuilt;
- `extracting` — useful behavior/DSP/state/theme is being recovered;
- `primitive-blocked` — a required low-level primitive is missing;
- `rebuilding` — its new Module Builder definition is being authored;
- `playable` — it performs its intended job in the new runtime;
- `verified` — playable, visually approved, patchable and persistence-tested on the target phone experience.

A placeholder face is never `playable`. Wrong or fake DSP is never `playable`. Passing CI alone never makes a module `verified`.