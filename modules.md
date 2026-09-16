# MultiSynth Modules

This file is the functional catalog for MultiSynth modules. Each entry describes what the module is supposed to do from the musician's point of view, not how the current code happens to implement it.

These descriptions are the behavioral target for future rebuilds. Timing, performance, transport, note, velocity, controller, pressure, pitch-bend, program, and other musical event behavior should use real MIDI semantics wherever MIDI applies rather than a parallel MIDI-like abstraction.

## +1 Merger
Combines multiple Carrier signals into one Carrier output. It is a simple patch-routing utility for bringing several audio paths back together without adding musical behavior of its own. As more inputs are used, another input remains available so the merger can grow with the patch.

## +1 Splitter
Takes one Carrier signal and makes it available on multiple Carrier outputs. It is used when the same audio source needs to feed several processors, instruments, mixers, or destinations at once. As outputs are used, another output remains available so the split can expand with the patch.

## Alchemy Mixer
A multi-channel Carrier mixer for combining several audio sources into a single downstream signal. Each connected source can be balanced independently with level, mute, and solo controls so the performer can shape the mix without changing the source modules themselves. It is intended to act as the main convergence point for groups of modules before the final output stage.

## Been Served
A playable amplitude-envelope processor for Carrier audio. Incoming notes open and close the signal according to attack, decay, sustain, and release, allowing an otherwise continuous Carrier source to be articulated like an instrument. The envelope responds to real note-on and note-off behavior and should correctly follow held and released notes.

## Big Deal
A granular sample-construction instrument built around the idea of cutting source audio into small pieces and dealing those pieces into new arrangements. It can reorganize, reverse, pitch, shuffle, combine, and otherwise recombine sampled material into fresh textures and phrases. The result should remain playable and exportable as useful musical material rather than behaving like a destructive file editor.

## Big Mouth
A formant and vocal-shape processor. It captures the changing resonant shape of a mouth or voice source and applies that character to a separate Carrier signal, allowing synths, samples, or other sounds to take on speech-like movement. Controls should focus on how strongly, how quickly, and in what tonal range that formant shape affects the Carrier.

## Bluetooth Output
A final-output module for sending the finished patch to a Bluetooth or other supported Android audio destination. It does not create or alter musical content beyond the requirements of delivering the final signal to the selected device. It belongs at the end of a Carrier chain.

## Control Freak
A general performance-controller module. It provides a playable keyboard plus assignable physical-style controls that can be bound to parameters exposed by other modules. Its purpose is to let the user perform and manipulate a patch from one dedicated control surface using real MIDI note and controller behavior where appropriate.

## Denzel's Equalizer
A Carrier equalizer used to reshape the frequency balance of an incoming signal. It allows the user to boost or cut selected frequency regions so a sound can be made brighter, darker, thinner, heavier, clearer, or better fitted into a mix. It is a tone-shaping processor, not a sound source.

## Echo Canyon
A Carrier delay and echo effect. It repeats incoming audio after a controllable delay and can feed those repeats back to create anything from a single echo to long decaying trails. The user should be able to control the relationship between the original signal and the delayed signal without changing the timing source of the rest of the patch.

## Father Time
The master timing and transport module for the patch. It exposes the shared BPM and represents the one authoritative musical timeline used by clock-aware modules. It also bridges that timing to and from real MIDI realtime messages and provides patchable clock outputs derived from the same timeline rather than creating a second scheduler.

## Garage Band
A three-band parallel filter processor. Incoming Carrier audio is separated into low, middle, and high frequency regions, each of which can be shaped independently before the bands are recombined. It is intended for broad tonal sculpting and parallel filtering rather than surgical equalization.

## Gene Sequencer
A 32-step monophonic note sequencer designed to feed pitched musical material into the rest of the patch. The user selects a step and plays a note to record that note into the selected step; each step stores its own note, active/rest state, duration in steps, and velocity, with velocity defaulting to 127 until changed. Sequence length can be set from 1 to 32 steps, playback follows the shared transport at a selectable musical division, and the current playback step is distinct from the step selected for editing.

Gene Sequencer includes a simple built-in sine, saw, or square Carrier so a sequence can be heard and programmed by itself. When an external Carrier is connected, that external Carrier hard-overrides the internal oscillator rather than being mixed with it. The sequencer remains monophonic and should express its musical behavior through real MIDI note, velocity, duration, and transport concepts rather than a private MIDI-like event format.

## Grain Liqour
A playable granular instrument built from saved audio. It turns sample material into a note-driven sound source whose grains can be spread, shifted, stretched, layered, and otherwise manipulated while still being performed like an instrument. MIDI notes determine musical pitch and triggering while the granular controls determine texture and motion.

## Hookworm
A granular echo and looping processor for incoming or recorded audio. It captures sound, recirculates it, and lets the performer stretch, fragment, smear, or repeat the captured material over time. It should feel like a live performance effect whose loops and grains evolve from the incoming Carrier rather than a conventional sample editor.

## Keyless88
A playable instrument that does not depend on a conventional piano-key front panel. It is intended to turn performance input into pitched Carrier output while emphasizing alternative control and signal interaction instead of a standard keyboard-centric layout. Its musical note behavior should still follow real MIDI semantics even if its physical interface is unconventional.

## Live Wire
A live audio-acquisition and performance module. It can bring external or network audio into the patch, hold that material locally for reliable playback, and let the user seek, scratch, loop, retrigger, overlap, and otherwise perform with it in real time. Useful captured material can also be recorded or copied into the sample library for use by other modules.

## LOWRIDER LFO
A low-frequency oscillator that produces slow repeating modulation-style movement. It is used for cyclical changes such as sweeps, fades, pulses, or other repeating parameter motion where a slow waveform is more useful than an audible pitched oscillator. Its job is continuous periodic movement, not note sequencing.

## Master of Levels
The final master level and drive stage for a Carrier chain. It controls the overall output level and can add deliberate saturation or overdrive before the signal reaches the final destination. It is the place to set final loudness and broad output character after the rest of the patch has been mixed.

## No Quarter
A playable synthesizer with its own distinct electric-piano-like voice and tonal character. MIDI notes trigger pitched voices, and the module shapes their attack, body, overtones, noise, and decay into a recognizable instrument rather than a generic oscillator. It outputs Carrier audio and is intended to stand on its own as a complete playable synth voice.

## Pulsynth
A playable pulse-wave synthesizer centered on pulse width and PWM-style tone shaping. MIDI notes determine pitch while the pulse structure and related controls determine harmonic character and motion. It should behave as a conventional playable synth in terms of note-on, note-off, velocity, and pitch handling even though its timbre is pulse-focused.

## PureSynth
A clean general-purpose synthesizer built around basic waveform generation and straightforward voice shaping. It provides familiar oscillator choices and responds directly to MIDI note performance so it can serve as a simple reference synth, utility voice, or starting Carrier source. Its emphasis is clarity and predictability rather than a highly specialized sound.

## QuadSynth
A playable synthesizer whose voice is built from four distinct components that can be combined into one sound. MIDI notes trigger the combined voice while the user balances and shapes the individual components to create the final timbre. It is intended for layered oscillator design within a single instrument module.

## Randrone
A generative drone instrument for sustained, evolving sound. It can create long-running tones on its own and can also react to musical notes and shared transport timing to introduce randomized or event-driven changes. The result should remain musically synchronized when timing is involved while still preserving the unstable, generative character of a drone machine.

## Razorback
A playable synthesizer designed for aggressive, cutting, or distorted tonal character. MIDI notes control pitch and articulation while the sound engine emphasizes sharper wave shapes and more forceful harmonic behavior than the cleaner synth modules. It should still obey normal instrument expectations for note and velocity handling.

## Rearranger
A song and section arranger used to organize multiple modules into larger musical structure. It lets the performer define sections, decide which modules or clips participate in each section, chain those sections into songs, and launch them in sync during live performance. Its job is arrangement and coordinated section control, not generation of a separate timing system.

## Sample Library
The shared library for saved sample material. It provides the user-facing place to organize audio into folders, select samples, rename or move them, create or remove folders, and make the same stored material available to sample-based modules. It is storage and organization, not a performance instrument.

## Sample Surgery
A sample-editing utility for preparing saved audio. It loads material from the sample library, lets the user trim or otherwise modify it, and saves the resulting sample back to the library without turning the editor itself into a live instrument. Its purpose is controlled preparation of source material for later use in samplers, granular modules, and other playback modules.

## SinLadder
A playable sine-focused synthesizer whose timbre is built from smooth harmonic components arranged in a ladder-like voice structure. MIDI notes determine pitch while the harmonic stages create increasingly complex tones from sine-based material. It is intended to remain smoother and more harmonic than the more aggressive synth families.

## Stinger
A playable synthesizer with a bright, pointed, fast-edged character. MIDI notes trigger the voice while its synthesis controls emphasize sharp attacks and cutting harmonics. It is meant to occupy a distinct sonic role from PureSynth, SinLadder, Pulsynth, and Razorback while retaining normal MIDI instrument behavior.

## Tail Gator
A terminal audio-routing module for choosing where the finished Carrier signal goes. It provides an explicit endpoint for a patch and directs that final signal toward an available output destination. It should not add musical processing beyond what is necessary to route the completed audio correctly.

## Tapeworm
A literal tape-loop style looper. Incoming or recorded audio is captured into a continuously cycling loop that can be replayed and manipulated as if it were a physical tape loop rather than a clip launcher or granular buffer. The defining behavior is persistent circular playback of the recorded material with tape-like performance control.

## TEST MODULE
A development and verification surface for the canonical shared-control library. It exists so every shared control, gesture, state behavior, visual variant, and Freewheel interaction can be exercised directly without confusing the test harness with a real musical module. It should remain a control-system test instrument, not accumulate unrelated production features.

## The Chopper
A sample-chopping module for turning longer recordings into playable slices. The user captures or loads audio, divides it into meaningful regions, auditions those regions, adjusts their boundaries or playback behavior, and saves or performs the resulting chops. Its purpose is to convert longer source material into reusable rhythmic or melodic pieces.

## Time Bandits
A 16-voice drum machine and rhythm sequencer with 32 steps. Each drum voice can be played directly from its assigned MIDI note and programmed into timed patterns that follow the shared transport. Step data can include performance values such as velocity and other rhythmic variations, but the module's fundamental job is straightforward: receive real MIDI drum notes, generate drum sounds, and play synchronized 32-step rhythm patterns.

## Unstable Diffusion
An experimental playable instrument for turning generated or sampled material into unstable, evolving sound. MIDI notes provide the basic performance structure while its controls determine how strongly the source is diffused, smeared, transformed, or made unpredictable. It should behave like an instrument with unusual timbre rather than like a background processor with no performance semantics.

## Whitman Sampler
A sixteen-slot performance sampler. Saved samples are assigned to slots, and MIDI notes 36 through 51 trigger those slots directly with normal note and velocity behavior. The module can be played manually or used in synchronized rhythmic sequencing, with all playback remaining tied to the same shared musical transport when timing is involved.
