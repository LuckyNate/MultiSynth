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

---

# Real MIDI Rebuild Addendum

This addendum is the rebuild contract. The legacy descriptions above remain temporarily for comparison and will be removed or folded into these specs after review.

## Global MIDI Rule

MultiSynth is a MIDI instrument. Every production module with controllable musical state must be controllable through real MIDI messages. No fake CV control vocabulary, no generic trigger packet standing in for a note, and no private MIDI-like event type may replace a message already defined by MIDI.

Use standard MIDI semantics wherever they exist: Note On/Off with velocity for notes; Pitch Bend for pitch expression; Poly Pressure or Channel Pressure for pressure; Program Change for program/preset selection where useful; CC64 for sustain; CC7 for volume; CC10 for pan; CC11 for expression; F8 for MIDI Clock; FA for Start; FB for Continue; FC for Stop; and standard channel-mode messages where appropriate. Parameters without a dedicated standard MIDI message receive an explicit assignable or fixed MIDI CC mapping. A physical control in the UI changes the same musical state addressed by its MIDI mapping.

Carrier is audio. MIDI is musical control/performance. Clock/transport uses real MIDI realtime semantics. Modules may expose audio routing and MIDI behavior simultaneously, but neither is translated into a fake substitute for the other.

Controller names below refer to canonical MultiSynth controls. The assigned MIDI CC numbers are rebuild defaults and can later be made learnable without changing the message type.

## +1 Merger — build spec

**Purpose:** Merge multiple Carrier signals into one output with minimal routing control.

**MIDI:** CC7 controls master output level. Each active input gets a MIDI-addressable level, mute, and solo using successive CC assignments allocated with the channel strip. Program Change may recall stored routing/mix snapshots.

**Controls:** per-input LEVEL — fader; MUTE — switch; SOLO — switch; MASTER — fader; output activity — meter.

**State:** input strip levels/mutes/solos, master level, optional recalled snapshot.

**Behavior:** used-plus-one Carrier inputs; summed output; no synthesis or timing behavior.

## +1 Splitter — build spec

**Purpose:** Distribute one Carrier signal to multiple independent outputs.

**MIDI:** CC7 controls source/master level. Each output gets MIDI-addressable level and mute through assigned CCs; Program Change may recall output-routing snapshots.

**Controls:** per-output LEVEL — fader; MUTE — switch; MASTER — fader; output activity — meter.

**State:** per-output level/mute and master level.

**Behavior:** used-plus-one outputs; all outputs derive from the same Carrier source.

## Alchemy Mixer — build spec

**Purpose:** Primary multi-channel performance mixer.

**MIDI:** CC7 = master level; CC10 = selected-channel pan; CC11 = selected-channel expression/trim; channel levels, mute, solo, and pan are directly MIDI CC addressable. Program Change recalls mixer scenes.

**Controls:** channel LEVEL — fader; PAN — knob; MUTE — switch; SOLO — switch; channel meter — meter; MASTER — fader; master meter — meter; scene select — encoder/readout.

**State:** channel level/pan/mute/solo, master level, selected scene.

**Behavior:** Carrier inputs mix to one Carrier output; no private automation clock.

## Been Served — build spec

**Purpose:** MIDI-played ADSR VCA for an incoming Carrier.

**MIDI:** Note On opens the envelope using note velocity; Note Off releases it; CC64 sustains held releases; CC73 = attack; CC75 = decay; CC70 = sustain; CC72 = release; CC11 = expression/output depth; Channel Pressure may scale envelope depth.

**Controls:** ATTACK/DECAY/SUSTAIN/RELEASE — knobs; EXPRESSION — fader; HOLD/SUSTAIN — switch; envelope activity — LED.

**State:** ADSR values, expression level, sustain state.

**Behavior:** poly-note bookkeeping may be used to decide when a monophonic Carrier envelope remains open, but incoming messages remain real MIDI notes.

## Big Deal — build spec

**Purpose:** Build playable granular material by cutting and rearranging source audio.

**MIDI:** Note On plays the generated/dealt material chromatically with velocity; Note Off releases; Pitch Bend changes pitch continuously; CC1 controls grain motion; CC11 expression; assigned CCs control grain size, density, spread, pitch range, reverse probability, shuffle/deal amount, and mix. Program Change recalls deals/patterns.

**Controls:** source select — encoder/readout; DEAL/SHUFFLE/REVERSE — buttons; grain SIZE/DENSITY/SPREAD/PITCH — knobs; MIX — fader; keyboard — performance keyboard; SAVE/EXPORT — button.

**State:** source references, current deal/order, granular parameters, selected program.

**Behavior:** produces playable Carrier output from sample material; editing never substitutes custom event packets for MIDI performance.

## Big Mouth — build spec

**Purpose:** Apply captured vocal/formant movement to a Carrier.

**MIDI:** Note messages pass through or address the paired instrument path as configured; CC1 = formant depth; CC11 = expression/mix; assigned CCs control formant shift, smoothing, speed, freeze, loop, and wet/dry; Program Change recalls formant captures/presets.

**Controls:** CAPTURE — button/hold; DEPTH — knob; SHIFT — knob; SMOOTH — knob; SPEED — knob; FREEZE — switch; LOOP — switch; MIX — fader; formant display — screen.

**State:** captured formant data reference, parameter values, freeze/loop state.

**Behavior:** incoming Carrier is the sound source; captured formants shape it.

## Bluetooth Output — build spec

**Purpose:** Final MIDI-controllable output destination selector and level stage.

**MIDI:** CC7 = output volume; CC120 = immediate all-sound-off at this terminal; Program Change selects stored output-device profiles where available.

**Controls:** DEVICE — encoder/readout; LEVEL — fader; MUTE — switch; output meter — meter.

**State:** selected destination, level, mute.

**Behavior:** terminal Carrier output only; no synthesis.

## Control Freak — build spec

**Purpose:** Dedicated hardware-style MIDI performance surface for the patch.

**MIDI OUT:** performance keyboard emits Note On/Off with velocity; pitch control emits Pitch Bend; modulation control emits CC1; sustain emits CC64; expression emits CC11; assignable knobs/faders/buttons emit real selectable CC messages; pressure-capable controls emit Channel or Poly Pressure where configured; Program Change controls program selection.

**MIDI IN:** receives matching MIDI feedback so controls/readouts reflect external state where supported.

**Controls:** keyboard — performance keyboard; PITCH — ribbon/XY spring axis; MOD — wheel-style encoder/ribbon; SUSTAIN — switch/pedal-style expression control; EXPRESSION — expression; assignable continuous controls — knobs/faders; assignable toggles/actions — switches/buttons; assignment display — screen/readout.

**State:** MIDI channel, controller assignments, ranges, polarity, program/bank selection.

**Behavior:** every emitted event is an actual MIDI message suitable for internal modules or external hardware/software.

## Denzel's Equalizer — build spec

**Purpose:** MIDI-controllable Carrier EQ.

**MIDI:** assigned CCs control each band gain and frequency/Q where exposed; CC11 controls overall effect expression; bypass uses an assigned CC switch; Program Change recalls EQ presets.

**Controls:** band GAIN — faders; band FREQUENCY — knobs; band Q — knobs where applicable; BYPASS — switch; input/output meters — meters.

**State:** band values, bypass, selected preset.

**Behavior:** audio-only processing path, but every user parameter is MIDI addressable.

## Echo Canyon — build spec

**Purpose:** MIDI-controllable synchronized or free-running delay.

**MIDI:** CC12 = effect control/delay time default; CC13 = feedback default; CC11 = wet/dry expression; assigned CCs for sync division, filter, freeze, bypass; F8 timing is used when SYNC is enabled; FA/FB/FC govern transport-following behavior where musical sync requires it.

**Controls:** TIME — knob; FEEDBACK — knob; MIX — fader; SYNC — switch; DIVISION — encoder/readout; FILTER/TONE — knob; FREEZE — switch; BYPASS — switch.

**State:** delay time/division, feedback, mix, tone, sync/freeze/bypass.

**Behavior:** F8-derived timing only when synced; never infer tempo with a private timer.

## Father Time — build spec

**Purpose:** Master MIDI realtime clock/transport panel and bridge.

**MIDI IN/OUT:** F8 Timing Clock at 24 PPQN; FA Start; FB Continue; FC Stop. External MIDI realtime can become the authoritative transport source. Internal transport emits the same real messages outward.

**Controls:** BPM — knob/encoder with readout; START — button; CONTINUE — button; STOP — button; clock activity — LED; source/status — readout.

**State:** internal BPM, selected/active external clock state where persistent configuration is required.

**Behavior:** one timeline only. No second scheduler. Patch timing followers consume this same MIDI realtime basis.

## Garage Band — build spec

**Purpose:** Three-band parallel filter instrument/effect.

**MIDI:** assigned CCs control LOW/MID/HIGH center frequency, resonance/Q, and band level; CC11 controls total expression; assigned CC toggles bypass; Program Change recalls filter setups.

**Controls:** each band FREQ — knob; Q/WIDTH — knob; LEVEL — fader; band MUTE — switch; master MIX — fader; BYPASS — switch.

**State:** three band parameter sets, mix, bypass.

**Behavior:** Carrier processor; all front-panel values respond to MIDI CC.

## Gene Sequencer — build spec

**Purpose:** 32-step monophonic real-MIDI sequencer with a basic built-in audition carrier.

**MIDI IN:** Note On records the played note and velocity into the currently selected step; Note Off may establish performed gate duration during live entry if enabled later, but base step duration is explicitly stored in steps. CC64 may sustain audition notes. F8/FA/FB/FC provide timing/transport.

**MIDI OUT:** sequence playback emits actual Note On with stored velocity and matching Note Off according to each step's stored length. No trigger substitute. The MIDI stream is usable by internal modules and external MIDI destinations.

**Carrier:** built-in sine/saw/square audition oscillator; external Carrier input hard-overrides the internal carrier with no blend.

**Controls:** 32 STEP SELECT — buttons; keyboard — performance keyboard; STEP LENGTH — encoder/knob (1–32 steps); REST/CLEAR — button; LOOP LENGTH — encoder/knob (1–32); DIVISION — encoder/readout; PLAY/STOP — switch or paired buttons; RESET — button; WAVEFORM sine/saw/square — three exclusive buttons; selected-note/velocity display — readout; current playback step — LEDs/state on step buttons.

**State:** 32 records `{note, active, length, velocity}`, velocity default 127; loop length; division; selected step; waveform.

**Behavior:** selecting a step then playing a note records it immediately. Rest clears that step. Playback follows the shared real MIDI transport.

## Grain Liqour — build spec

**Purpose:** Play saved audio as a granular MIDI instrument.

**MIDI:** Note On/Off + velocity control voices; Pitch Bend changes pitch; CC1 grain motion; CC11 expression; assigned CCs grain size, density, spread, position, jitter, pitch scatter, envelope, and mix; CC64 sustain; Program Change chooses stored grain programs/sample sets.

**Controls:** sample select — encoder/readout; keyboard — performance keyboard; POSITION — ribbon; SIZE/DENSITY/SPREAD/JITTER — knobs; envelope — ADSR prefab; MIX/LEVEL — faders; program select — encoder/readout.

**State:** sample reference, granular settings, envelope, program.

**Behavior:** a normal MIDI-playable instrument whose synthesis method is granular.

## Hookworm — build spec

**Purpose:** Live granular echo/loop processor.

**MIDI:** assigned CCs control record, loop enable, grain size, stretch, feedback, smear, speed, reverse, mix, and clear; F8 enables synchronized loop/division operation; FA/FB/FC align transport-aware behavior; Program Change recalls loop-performance presets.

**Controls:** RECORD — hold button; LOOP — switch; CLEAR — button; SIZE/STRETCH/FEEDBACK/SMEAR/SPEED — knobs; REVERSE — switch; DIVISION — encoder/readout; SYNC — switch; MIX — fader.

**State:** loop buffer reference/state, loop boundaries, processing controls, sync state.

**Behavior:** Carrier/audio capture remains audio; all performance commands are actual MIDI-addressable controls.

## Keyless88 — build spec

**Purpose:** Alternative-interface pitched MIDI instrument.

**MIDI:** Note On/Off with velocity; Pitch Bend; Channel Pressure and/or Poly Pressure if its performance surface supports pressure; CC1 modulation; CC11 expression; CC64 sustain; assigned CCs for timbral parameters; Program Change presets.

**Controls:** alternative pitch/performance surface — XY/ribbon/pads as appropriate to the final identity; expression — expression control; modulation — ribbon/knob; sustain — switch; timbre controls — knobs; output level — fader; program — encoder/readout.

**State:** synthesis parameters, controller mode/ranges, program.

**Behavior:** unconventional UI, conventional real MIDI semantics.

## Live Wire — build spec

**Purpose:** Acquire and perform external/network audio like a deck/instrument.

**MIDI:** Note On can trigger/retrigger loaded material with velocity; Note Off can stop/gate when mode requires; Pitch Bend may scrub/pitch where musically appropriate; assigned CCs control play, stop, cue, seek, loop, loop size, speed, level, and record/copy actions; F8/FA/FB/FC support synchronized looping/playback; Program Change recalls sources/cues.

**Controls:** platter/seek — turntable; PLAY/STOP/CUE — buttons; LOOP — switch; LOOP SIZE — encoder; SPEED — fader; LEVEL — fader; RECORD/COPY — buttons; source browser — screen/encoder.

**State:** source reference, cue/position, loop settings, speed, selected program.

**Behavior:** actual media audio path plus real MIDI performance control.

## LOWRIDER LFO — build spec

**Purpose:** MIDI-synchronized low-frequency modulation source.

**MIDI:** F8/FA/FB/FC provide optional synchronized phase/timing. Assigned CCs set rate/division, depth, waveform, phase, bipolar/unipolar mode, and reset. The modulation output itself must use the real MIDI control path selected for its destination—normally a chosen CC, Pitch Bend, Channel Pressure, or another explicitly configured MIDI message—not a fake CV packet.

**Controls:** RATE/DIVISION — encoder; DEPTH — knob; WAVEFORM — selector buttons/encoder; PHASE — knob; SYNC — switch; RESET — button; DESTINATION MESSAGE/CC — encoder/readout.

**State:** rate/division, waveform, depth, phase, sync, selected MIDI output message/controller.

**Behavior:** modulation is emitted as real MIDI data when used as a controller source.

## Master of Levels — build spec

**Purpose:** Final MIDI-controllable gain and drive stage.

**MIDI:** CC7 = master volume; CC11 = expression; assigned CC = drive/saturation and bypass/mute; CC120 = immediate output silence; Program Change recalls master profiles.

**Controls:** DRIVE — knob; GAIN — fader; MASTER — fader; MUTE — switch; meter — meter.

**State:** drive, gain, master, mute.

**Behavior:** terminal dynamics/level stage; no private control protocol.

## No Quarter — build spec

**Purpose:** Electric-piano-like playable MIDI synthesizer.

**MIDI:** Note On/Off with velocity; Pitch Bend; CC64 sustain; CC11 expression; Channel Pressure may increase bark/drive; assigned CCs for clean, bell, bark, noise, darkness, ambience/water/haunt/crackle character; Program Change presets.

**Controls:** keyboard — performance keyboard; CLEAN/BELL/BARK/NOISE/DARKNESS/AMBIENCE character — knobs; ADSR/release shaping where musically required — knobs; SUSTAIN — switch; EXPRESSION/LEVEL — fader; program — encoder/readout.

**State:** tone controls, envelope/release, program.

**Behavior:** complete polyphonic MIDI instrument with its own Carrier output.

## Pulsynth — build spec

**Purpose:** Pulse/PWM MIDI synthesizer.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation defaults to PWM depth; CC11 expression; CC64 sustain; assigned CCs for duty/PWM rate/depth, oscillator amounts, tuning, ADSR, filter/tone if part of the final minimal voice; Program Change presets.

**Controls:** keyboard — performance keyboard; DUTY/PWM controls — knobs; oscillator amount/tune — knobs; ADSR — prefab; MOD — knob/ribbon; LEVEL — fader; program — encoder/readout.

**State:** synthesis parameters and program.

**Behavior:** standard MIDI instrument behavior; pulse synthesis is its identity, not a different event architecture.

## PureSynth — build spec

**Purpose:** Reference/basic waveform MIDI synthesizer.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain; assigned CCs for waveform, shape/phase/duty, ADSR, level; Program Change presets.

**Controls:** waveform sine/square/triangle/saw/noise choices — exclusive buttons/encoder; SHAPE — encoder; ADSR — prefab; keyboard — performance keyboard; expression/level — fader; program — encoder/readout.

**State:** waveform/shape, envelope, level, program.

**Behavior:** simplest complete conventional MIDI synth in MultiSynth.

## QuadSynth — build spec

**Purpose:** Four-component layered MIDI synthesizer.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain; each component's level/tune/mute/solo is CC-addressable; assigned CCs for shared envelope/tone; Program Change presets.

**Controls:** four component LEVEL — faders; TUNE/OCTAVE — knobs/encoders; MUTE/SOLO — switches; ADSR — prefab; keyboard — performance keyboard; master level — fader.

**State:** four component settings, shared voice settings, program.

**Behavior:** one MIDI note creates one layered voice using enabled components.

## Randrone — build spec

**Purpose:** Generative drone MIDI instrument that can run continuously or respond to performance/timing.

**MIDI:** Note On/Off establishes root/voice events; velocity influences intensity; Pitch Bend changes root pitch; CC1 controls generative motion; CC11 expression; assigned CCs randomness, density, range, drift, hold, regenerate; F8/FA/FB/FC synchronize event changes when sync is enabled; Program Change presets.

**Controls:** root/pitch — encoder; RANDOM/DENSITY/RANGE/DRIFT — knobs; HOLD — switch; REGENERATE — button; SYNC — switch; DIVISION — encoder; LEVEL — fader.

**State:** generator parameters, root, sync/division, program.

**Behavior:** generative decisions may be internal, but all external musical control remains actual MIDI.

## Razorback — build spec

**Purpose:** Aggressive MIDI synthesizer with movable-peak/sharp-wave identity.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain; assigned CCs for peak positions, oscillator amounts, drive/tone, ADSR; Program Change presets.

**Controls:** PEAK controls — knobs; oscillator/stage amount — knobs; DRIVE/TONE — knobs; ADSR — prefab; keyboard — performance keyboard; LEVEL — fader.

**State:** synthesis parameters and program.

**Behavior:** conventional MIDI performance; aggressive synthesis only defines sound.

## Rearranger — build spec

**Purpose:** MIDI-driven section/song arranger for coordinated module performance.

**MIDI IN:** F8/FA/FB/FC define timing and transport; Program Change selects/launches sections or songs; MIDI notes may optionally launch section slots if mapped; assigned CCs control next/previous/launch/stop and live arrangement actions.

**MIDI OUT:** emits the real MIDI Program Change/CC/transport/note messages required to command participating modules; does not call private pseudo-events instead of MIDI.

**Controls:** section pads — pads; song/section select — encoder/readout; LAUNCH/STOP/NEXT/PREV — buttons; chain editor — screen; quantize/division — encoder.

**State:** section definitions, chains, module MIDI assignments, launch quantization, selected song/section.

**Behavior:** arrangement follows shared realtime MIDI clock and sends actual MIDI commands to modules.

## Sample Library — build spec

**Purpose:** Shared sample storage that is still reachable from the MIDI instrument surface.

**MIDI:** Program Change selects saved sample/library programs where a performance mapping exists; assigned CCs may step selection, load/preview, and navigate a performance-safe subset. File-management operations remain UI actions but may also have explicit MIDI CC/button mappings when safe and useful.

**Controls:** browser — screen; navigation/select — encoder; PREVIEW/LOAD — buttons; file actions — buttons.

**State:** folder/sample organization and current selection.

**Behavior:** storage remains storage; MIDI access never replaces file integrity rules.

## Sample Surgery — build spec

**Purpose:** Prepare samples while remaining addressable from the MIDI control surface.

**MIDI:** assigned CCs control start/end, zoom/scrub, gain, normalize/processing parameters, audition and save actions; Note On auditions the current sample/slice with velocity; Pitch Bend may scrub audition pitch only where intentionally enabled; Program Change recalls editing presets, not destructive file state.

**Controls:** waveform display — screen; START/END — ribbons/encoders; SCRUB — turntable/ribbon; GAIN — knob; AUDITION — pad/button; SAVE — button.

**State:** current source reference, edit boundaries, processing settings.

**Behavior:** edits remain explicit; MIDI controls the same editor functions as the front panel.

## SinLadder — build spec

**Purpose:** Smooth sine/harmonic ladder MIDI synthesizer.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 harmonic modulation; CC11 expression; CC64 sustain; assigned CCs harmonic numbers/amounts, stage tuning/phase, ADSR; Program Change presets.

**Controls:** harmonic/stage AMOUNT — knobs; HARMONIC/TUNE — encoders; PHASE — knobs; ADSR — prefab; keyboard — performance keyboard; LEVEL — fader.

**State:** harmonic/stage parameters, envelope, program.

**Behavior:** standard MIDI instrument semantics.

## Stinger — build spec

**Purpose:** Bright pointed transient/harmonic MIDI synthesizer.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain; assigned CCs acceleration/shape/stage amount/tune/ADSR; Program Change presets.

**Controls:** ACCELERATION/SHAPE — knobs; stage amount/tune — knobs; ADSR — prefab; keyboard — performance keyboard; LEVEL — fader.

**State:** synthesis parameters and program.

**Behavior:** normal MIDI voice behavior with Stinger-specific synthesis.

## Tail Gator — build spec

**Purpose:** MIDI-controllable final output router.

**MIDI:** Program Change selects saved output destinations/routes; assigned CC selects destination and mute; CC7 output level; CC120 immediate silence.

**Controls:** DESTINATION — encoder/readout; LEVEL — fader; MUTE — switch; activity — meter.

**State:** destination, level, mute.

**Behavior:** terminal routing only; all selectable state is MIDI addressable.

## Tapeworm — build spec

**Purpose:** Literal tape-loop looper with real MIDI transport/control.

**MIDI:** assigned CCs for record, overdub if retained, play, stop, clear, reverse, speed, feedback, loop level, and splice/loop length; F8/FA/FB/FC synchronize loop transport when SYNC is enabled; Pitch Bend may act as momentary tape-speed bend/scrub; Program Change recalls loop-performance setups.

**Controls:** RECORD — hold button; PLAY/STOP — buttons; CLEAR — button; SPEED — fader/turntable; REVERSE — switch; LOOP LENGTH — encoder; FEEDBACK — knob; LEVEL — fader; tape position — readout/screen.

**State:** loop audio reference/buffer state, loop length, speed, reverse, feedback, sync.

**Behavior:** continuous circular tape playback; MIDI controls the machine directly.

## TEST MODULE — build spec

**Purpose:** Verify every canonical control and its real MIDI binding behavior.

**MIDI:** every testable control can be assigned a legitimate MIDI message appropriate to its type: CC for knobs/faders/switches/buttons, Note messages for pads/keyboard, Pitch Bend for pitch controls, pressure for pressure controls, Program Change where relevant, realtime messages for timing indicators. It must expose received raw MIDI message/status data for verification.

**Controls:** one canonical example of every control family plus readouts/screens that show generated and received MIDI.

**State:** test bindings and selected test modes only.

**Behavior:** proves canonical controls and MIDI mapping; never invents a substitute protocol for easier testing.

## The Chopper — build spec

**Purpose:** Turn long samples into MIDI-playable slices.

**MIDI:** slice pads/slots map to real Note On/Off with velocity; Pitch Bend affects active slice pitch where enabled; CC11 expression; assigned CCs control slice start/end, pitch, level, choke group, reverse and selected slice; Program Change recalls chop maps.

**Controls:** waveform/slice display — screen; slice pads — pads; START/END — encoders/ribbons; PITCH — knob; REVERSE — switch; LEVEL — fader; SAVE — button.

**State:** source reference, slice boundaries/settings, note map, program.

**Behavior:** each playable chop is a genuine MIDI note destination.

## Time Bandits — build spec

**Purpose:** 16-voice, 32-step real-MIDI drum machine.

**MIDI IN:** Notes 36–51 trigger the 16 voices with velocity; Note Off may choke/stop voices where that voice supports it; assigned CCs control voice parameters and selected-step parameters; F8/FA/FB/FC govern sequencer timing/transport; Program Change recalls kits/patterns.

**MIDI OUT:** internal 32-step sequencing emits the same actual Note On/Off messages used for external performance, including stored velocity. Ratchets, if retained, are multiple real Note On/Off events.

**Controls:** 16 voice pads — pads; 32 steps — buttons; selected voice parameters — knobs; VELOCITY — knob/encoder; LENGTH — encoder; PLAY/STOP/RESET — buttons/switches; kit/pattern — encoder/readout.

**State:** kit/voice settings, 32-step pattern data, pattern length, selected voice/step, program.

**Behavior:** manual play and sequencer playback use one MIDI note path.

## Unstable Diffusion — build spec

**Purpose:** Experimental evolving MIDI instrument.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain where appropriate; assigned CCs diffusion, instability, smear, source blend, density, feedback/chaos, envelope; Program Change presets.

**Controls:** DIFFUSION/INSTABILITY/SMEAR/DENSITY/CHAOS — knobs; SOURCE/MIX — fader; ADSR — prefab where voice-gated; keyboard — performance keyboard; program — encoder/readout.

**State:** sound-generation/processing parameters and program.

**Behavior:** unusual sound, ordinary real MIDI performance contract.

## Whitman Sampler — build spec

**Purpose:** 16-slot real-MIDI performance sampler with optional synchronized sequencing.

**MIDI IN:** Notes 36–51 trigger sample slots with velocity; Note Off stops/gates slots according to their mode; assigned CCs control selected slot level, pitch, pan, start/end, loop/choke, and global controls; F8/FA/FB/FC run any internal sequencer; Program Change recalls banks/patterns.

**MIDI OUT:** internal sequencing emits actual Note On/Off for slots rather than directly invoking a private trigger path.

**Controls:** 16 sample pads — pads; 32 sequencer steps when present — buttons; selected slot LEVEL — fader; PAN — knob; PITCH — knob; START/END — encoders/ribbons; LOOP/CHOKE — switches; bank/pattern — encoder/readout.

**State:** sample assignments, slot settings, note map, pattern data, bank/program.

**Behavior:** manual pad play, external MIDI, and internal sequencer all converge on the same real MIDI note handling.

## Review rule before legacy cleanup

Each module spec must be reviewed for two things before its legacy prose is removed: (1) every user-facing musical/control feature is reachable through an actual MIDI message, and (2) the physical controller listed is the simplest appropriate canonical controller for that feature. After that review, the legacy description can be deleted or reduced to a one-line purpose statement without losing the rebuild contract.