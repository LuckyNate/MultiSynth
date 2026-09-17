# MultiSynth Modules — Real MIDI Rebuild Contract

This file is the musician-facing rebuild contract and status ledger for the active registered module roster.

The authoritative runtime roster is `app/src/main/assets/module-manifest.js`. Historical or retired modules do not belong in this file merely because they still exist in Git history.

## Hard architecture rules

- MultiSynth is a real-MIDI instrument and modular audio workstation.
- Carrier is audio. MIDI is musical control/performance. Clock/transport use real MIDI realtime semantics.
- Use standard MIDI messages wherever they exist: Note On/Off + velocity, Pitch Bend, Channel/Poly Pressure, Program Change, CC64 sustain, CC7 level, CC10 pan, CC11 expression, F8 clock, FA Start, FB Continue, FC Stop, and standard channel-mode messages where appropriate.
- A UI control and its MIDI mapping address the same authoritative module state.
- No fake CV packet, generic trigger packet, or private MIDI-like substitute may replace a standard MIDI message.
- `PatchTransport` is the only internal timing authority. Timing-aware modules derive scheduling from the shared transport rather than private timers.
- Modules consume canonical controls/prefabs. They do not recreate canonical physical controls or their interaction.
- Reuse established module software patterns wherever applicable: state shape, MIDI/event flow, timing/scheduling, lifecycle, persistence, editor/runtime separation, canonical controls, and smoke coverage.
- A module is COMPLETE only when its rebuilt behavior has relevant smoke coverage and the full CI/build is green.

## Active registered roster

This is the complete current registered module list:

1. Live Wire
2. Father Time
3. Whitman Sampler
4. Time Bandits
5. Rearranger
6. The Chopper
7. Sample Surgery
8. Sample Library
9. Big Deal
10. Big Mouth
11. Grain Liqour
12. Been Served
13. Garage Band
14. Master of Levels
15. Alchemy Mixer
16. +1 Splitter
17. +1 Merger
18. Denzel's Equalizer
19. Echo Canyon
20. Control Freak
21. LOWRIDER LFO
22. Unstable Diffusion
23. Keyless88
24. TEST MODULE
25. PureSynth
26. QuadSynth
27. Hook and Ladder
28. No Quarter
29. Randrone
30. Hookworm
31. Tapeworm
32. Tail Gator
33. MIDIchlorian
34. Bluetooth Output

The former Pulsynth, SinLadder, Razorback, Stinger, and LadderSynth family is retired. Hook and Ladder replaces that fixed ladder family with a generalized dynamically expanding operator ladder.

Gene Sequencer is not currently a registered module and is not part of the active roster.

## Rebuild status

### COMPLETE

- Father Time
- Whitman Sampler
- Time Bandits
- PureSynth
- QuadSynth

### ACTIVE / REBUILD PASS NOT YET CLOSED

Every other production module in the roster remains part of the same full real-MIDI rebuild pass until explicitly marked COMPLETE.

`TEST MODULE` is the canonical development/control verification harness rather than a production-module rebuild target.

## Mandatory rebuild sequence

For each production module:

1. Define exactly what it is from the musician's point of view.
2. Confirm the smallest complete feature set.
3. Assign canonical controls/prefabs to every user-facing feature.
4. Define exact real MIDI input/output behavior and CC mappings.
5. Rebuild or align runtime behavior using the established software patterns.
6. Ensure UI and MIDI write the same persistent state.
7. Verify timing against `PatchTransport` when applicable.
8. Verify persistence, active-state application, cleanup and panic/lifecycle behavior.
9. Add or update behavioral smoke coverage.
10. Run full CI/build and fix failures before marking COMPLETE.

## Module contracts

### Live Wire
External/network audio acquisition and performance deck. Real MIDI controls playback, cueing, loop/speed/level and performance actions; synchronized behavior follows shared realtime transport.

### Father Time — COMPLETE
Visible master-clock panel and physical MIDI realtime bridge. Owns BPM presentation and F8/FA/FB/FC hardware bridge behavior without becoming a second timing authority.

### Whitman Sampler — COMPLETE
Sixteen-slot sampler with 32-step sequencing. Notes 36–51 address slots with velocity. Manual play, external MIDI and internal sequencing converge on the same real MIDI note path. Internal sequencing uses scheduled shared-transport pulses.

### Time Bandits — COMPLETE
Sixteen-voice, 32-step drum machine. Notes 36–51 address drum voices with velocity. Ratchets and pattern playback emit real Note On/Off events through the same receiver path used by external MIDI.

### Rearranger
Section/song arranger and synchronized launcher. Uses real MIDI notes/CC/program/transport to command participating modules and follows the shared transport for quantized launches.

### The Chopper
MIDI-playable slice/chop instrument for longer recordings. Slice slots respond to real Note On/Off + velocity; pitch, reverse, boundaries, level and choke behavior are MIDI-addressable.

### Sample Surgery
Sample editor for trimming, boundaries, gain, audition and processing. MIDI controls the same editor state/actions as the front panel; audition uses real note semantics where applicable.

### Sample Library
Shared storage/organization surface for sample assets. MIDI may navigate/select/preview performance-safe functions without inventing a private control protocol.

### Big Deal
Granular sample/deal instrument. Real notes play generated material with velocity; pitch bend, modulation, expression and explicit CC mappings address granular state.

### Big Mouth
Formant/vocal-shape processor for incoming Carrier audio. Real MIDI controls formant depth, shift, smoothing, speed, freeze/loop and mix.

### Grain Liqour
Playable granular instrument. Real Note On/Off + velocity, Pitch Bend, CC1, CC11, CC64 and explicit granular CC mappings control voices and grain state.

### Been Served
MIDI-articulated Carrier envelope. Note On/Off drives gating with velocity; CC64 sustain plus ADSR/expression mappings control the same envelope state as the UI.

### Garage Band
Three-band Carrier processor. Band frequency/Q/level/mute plus overall mix/bypass are real-MIDI addressable.

### Master of Levels
Terminal gain/drive/saturation stage. CC7/CC11 and explicit drive/mute mappings control final level behavior; channel-mode silence semantics apply where appropriate.

### Alchemy Mixer
Dynamic multi-input performance mixer. Channel level/pan/mute/solo and master state are MIDI-addressable; scenes may use Program Change.

### +1 Splitter
Used-plus-one Carrier splitter. One source expands to independently controllable outputs; output level/mute state is MIDI-addressable.

### +1 Merger
Used-plus-one Carrier merger. Multiple active inputs combine into one controllable output; input/master level, mute and solo state is MIDI-addressable.

### Denzel's Equalizer
Carrier EQ processor. Exposed band gain/frequency/Q, bypass and expression are controlled by explicit real MIDI mappings.

### Echo Canyon
Delay processor with free and synchronized operation. Delay parameters use MIDI CC; synchronized divisions derive from F8/FA/FB/FC shared transport rather than a private timer.

### Control Freak
Dedicated real-MIDI controller surface. Generates and receives actual Note, CC, Pitch Bend, pressure, sustain, expression and Program Change messages for internal or external targets.

### LOWRIDER LFO
MIDI modulation generator. Output is a configured real MIDI message such as CC, Pitch Bend or Pressure; synchronized phase/rate follows shared realtime transport.

### Unstable Diffusion
Experimental playable instrument/processor with normal real-MIDI performance semantics: Note On/Off + velocity, Pitch Bend, modulation, expression, sustain where applicable and explicit parameter CCs.

### Keyless88
Alternative performance instrument surface with conventional real-MIDI semantics. Its unusual physical interface does not create a private event protocol.

### TEST MODULE
Canonical control and MIDI verification harness. Exercises real shared controls, gestures, bindings and legitimate MIDI message types. It is not a production instrument.

### PureSynth — COMPLETE
Reference conventional synth voice. Real Note On/Off + velocity, Pitch Bend, modulation, expression, sustain, envelope and waveform/shape control provide the baseline instrument contract.

### QuadSynth — COMPLETE
Layered synth voice using the current Quad engine choices. Real MIDI performance, sustain, expression, pitch and component/shared controls use the same module state as the UI.

### Hook and Ladder
Dynamic +1 serial operator-ladder synth and the active replacement for the retired fixed ladder family.

Source 1 is always active. The module always exposes one inactive next rung. Activating the current last rung creates another inactive rung, so the chain grows only as used.

Each active rung receives the accumulated output from the previous rung and combines its own waveform/source with that signal using its selected operator. Current operator vocabulary includes additive, subtractive, multiply/ring-style, AM and FM behavior. Each rung owns its source type/shape, phase, octave, detune, amount and operator state.

Real MIDI performance follows the established synth-family pattern: Note On/Off + velocity, Pitch Bend, CC1 modulation, CC7 level, CC11 expression, CC64 sustain, ADSR controls and Program Change/state persistence. Dynamic rung state must persist and live changes must apply to active voices without rebuilding the patch graph.

### No Quarter
Electric-piano-style polyphonic instrument. Real MIDI controls notes, velocity, pitch, sustain, expression and its tone/character parameters; instrument-specific DSP remains the reason it differs from the generic synth pattern.

### Randrone
Generative drone instrument. Notes, pitch, modulation/expression and explicit parameter CCs control the generator; synchronized automatic changes follow shared transport.

### Hookworm
Live granular echo/loop processor. Record/loop/grain/stretch/feedback/speed/reverse/mix functions are real-MIDI addressable; synchronized operation follows shared transport.

### Tapeworm
Literal continuously cycling tape-loop machine. Record/play/stop/clear/reverse/speed/feedback/length/level are MIDI-addressable; synchronized operation follows shared transport.

### Tail Gator
Terminal Carrier routing module. Destination, level and mute are MIDI-addressable; it performs routing rather than synthesis.

### MIDIchlorian
Physical MIDI output/event-recorder path. It forwards ordinary MIDI channel/performance traffic through the native MIDI bridge. Father Time remains the sole physical F8/FA/FB/FC realtime-clock bridge so output modules cannot double-clock external devices.

### Bluetooth Output
Terminal audio-routing module for supported Android/Bluetooth output destinations. Device selection, level and mute are explicit module state; it does not create musical timing or synthesis.

## Completion rule

The full MIDI rebuild is finished only when every active production module above is explicitly COMPLETE, each rebuilt behavior has relevant smoke coverage, and the full CI/build is green.
