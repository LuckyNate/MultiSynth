# MultiSynth Modules

This is the working catalog of registered MultiSynth modules. Keep each description focused on what the module actually does in a patch. Update this file as module behavior changes during the completeness / uniqueness / modularity review.

## +1 Merger
Combines multiple Carrier inputs into one Carrier output using the dynamic used-plus-one routing pattern, so one spare input remains available as the patch grows.

## +1 Splitter
Takes one Carrier input and fans it out to multiple Carrier outputs using the dynamic used-plus-one routing pattern, so one spare output remains available as the patch grows.

## Alchemy Mixer
Dynamic multi-input output mixer. Each connected Carrier input gets its own level, mute, solo, and meter strip, and the mixed Carrier signal continues downstream to the next end-of-chain component.

## Been Served
MIDI-note-driven ADSR amplitude-envelope processor. Carrier audio passes through a gain stage shaped by attack, decay, sustain, and release; note-on starts the envelope and release begins when the last held note ends.

## Big Deal
Granular card-dealer / sample-construction module. It cuts PCM sources at zero crossings into short cards, then can deal them straight, shuffled, reversed, flipped, pitched, tiled, or riffled across multiple sources, with grain and PCM export.

## Big Mouth
Formant-imprint processor. It analyzes a microphone recording or saved PCM into a time-varying formant map, then applies that mouth/formant shape to separate incoming Carrier audio with depth, shift, smoothing, speed, mix, freeze, and loop controls.

## Bluetooth Output
Terminal audio-routing module for sending the patch output to a selectable Bluetooth / Android audio destination.

## Control Freak
Performance-controller module built around shared keyboard/control hardware and MIDI. Its long-term job is to provide playable keys plus assignable controls that can bind to exposed module state.

## Denzel's Equalizer
Carrier equalizer processor for shaping the spectral balance of an incoming signal across multiple EQ bands.

## Echo Canyon
Carrier delay / echo effect. It creates repeated copies of incoming audio with controllable delay behavior, feedback, and wet/dry balance.

## Father Time
Visible master-clock panel and external MIDI-clock bridge. It exposes the shared patch BPM, follows the one PatchTransport timeline, sends real MIDI realtime clock/transport, and provides patchable Clock outputs derived from that master timing.

## Garage Band
Three-channel parallel band-pass filter. Incoming Carrier audio is split into low, mid, and high band-pass paths, each with independent center-frequency and Q/width controls, then recombined.

## Grain Liqour
Playable granular instrument built from saved PCM/grain material. It turns library audio into a note-driven granular sound source and outputs Carrier audio.

## Hookworm
Granular echo / loop processor for incoming or microphone audio. It captures and recirculates sound through a granular delay path with performance-oriented stretching and loop manipulation.

## Keyless88
Playable signal-processing instrument that generates/transforms Carrier audio without a conventional piano-key front panel; intended as a performance instrument rather than a utility processor.

## Live Wire
Audio-acquisition and performance module. It searches/loads network audio, keeps PCM resident, provides real platter-style seek/scratch/playback, manual triggering, clip/overlap and loop behavior, and can record or copy material into the sample library.

## LOWRIDER LFO
Low-frequency oscillator generator used as a slow repeating signal source. It produces a controllable periodic output intended for modulation-style movement and other low-frequency patch duties.

## Master of Levels
Terminal master gain/drive stage. Incoming Carrier audio passes through pre gain, main gain, waveshaping overdrive, and final master level, with output metering.

## No Quarter
Playable synthesizer instrument with its own synthesis voice architecture and MIDI note input. It generates Carrier audio as one of the app's distinct synth voices.

## Pulsynth
Playable pulse/PWM-oriented synthesizer. MIDI notes drive a pulse-based voice whose timbre centers on pulse-width / PWM-style synthesis.

## PureSynth
Playable general-purpose synthesizer focused on a comparatively clean/simple synthesis voice. MIDI notes generate Carrier audio through its own oscillator/filter/amplitude architecture.

## QuadSynth
Playable synthesizer built around a four-part / four-oscillator voice concept. MIDI notes drive the combined voice and produce Carrier audio.

## Randrone
Generative drone instrument. It creates sustained evolving sound and can respond to MIDI Note On and shared transport/clock timing for randomized or event-driven changes.

## Razorback
Playable aggressive synth voice with its own oscillator/filter character. MIDI notes generate Carrier audio with a harsher/distorted tonal identity than the cleaner synth modules.

## Rearranger
Song/section arranger for launching and chaining musical sections across modules. It organizes clip/section state into larger song structure and synchronized live arrangement flow.

## Sample Library
Persistent PCM/grain library manager. It presents the canonical `SAMPLES` folder tree, lets samples and folders be selected, copied, renamed, moved, created, and deleted, and provides the shared organization used by sample-based modules.

## Sample Surgery
Non-destructive / working sample-editing utility for saved PCM. It loads library audio, performs sample-oriented editing/processing operations, and writes resulting material back into the sample library.

## SinLadder
Playable sine-based synthesizer with ladder-filter-style shaping. MIDI notes generate Carrier audio with a smooth sine-focused source and filter character.

## Stinger
Playable synth voice with a bright, sharp performance character. MIDI notes generate Carrier audio through its own distinct synthesis configuration.

## Tail Gator
Terminal audio-routing module for selecting and feeding an available output destination at the end of a Carrier chain.

## Tapeworm
Tape-loop processor / looper. Incoming or microphone audio is captured into a literal tape-style loop whose playback behavior is manipulated as a continuously cycling recording.

## TEST MODULE
Development harness for the canonical shared-control library. It exists to exercise real controls, variants, interaction, binding, and Freewheel behavior without pretending to be a production musical module.

## The Chopper
Sample chopping module. It captures or loads PCM, divides it into playable slices/chops, and provides controls for selecting, manipulating, auditioning, and saving chopped material.

## Time Bandits
Clock-aware drum/rhythm instrument with 16 playable voices mapped to MIDI notes 36–51. It combines manual/MIDI drum triggering with shared PatchTransport timing for rhythmic performance and sequencing.

## Unstable Diffusion
Experimental sample/synthesis instrument that transforms generated and/or PCM-derived material into unstable evolving Carrier audio. MIDI note input drives the playable voice while its parameters control the amount and character of the diffusion/process.

## Whitman Sampler
Sixteen-slot performance sampler. Saved PCM is assigned to slots, MIDI notes 36–51 trigger those slots, and the module can perform them manually or in shared-clock-aware sequencing while mixing its sample output into the Carrier path.
