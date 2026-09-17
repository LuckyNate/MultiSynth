# MultiSynth Modules — Real MIDI Rebuild Specification

## TOP PRIORITY — CANONICAL CONTROLS ONLY, ZERO BESPOKE MODULE CONTROL LAYOUT

No production module may define bespoke control geometry or control layout. This is a hard architecture rule and takes priority over every module-specific build spec below.

Modules choose canonical controls/prefabs and define their musical meaning, state, defaults, MIDI mapping, and ordering. Modules must not define per-module control widths, heights, touch sizes, spacing, positioning, one-off control CSS, renderer geometry overrides, or local replacements for canonical controls. A module must not pass custom visual geometry into a canonical control to make it fit that module.

If an existing canonical control or prefab cannot represent the required physical control, fix or extend the canonical control library first, then use that shared implementation from the module. Any legitimate new shape/layout becomes a reusable canonical control variant or prefab, never a module-only special case.

The purpose of the control library is to make module production consistent and fast. Rebuilds must reuse it rather than recreating control presentation inside modules.

This file is the functional rebuild contract for MultiSynth. MultiSynth is a MIDI instrument. Each module is defined from the musician's point of view first, then rebuilt from the floor up around real MIDI behavior and the canonical control library.

## Rebuild status

Completed in the current rebuild pass:

- **Father Time — COMPLETE**
- **Whitman Sampler — COMPLETE**
- **Time Bandits — COMPLETE**
- **PureSynth — COMPLETE**
- **QuadSynth — COMPLETE**
- **Pulsynth — COMPLETE**
- **SinLadder — COMPLETE**
- **Razorback — COMPLETE**
- **Stinger — COMPLETE**

Low-priority rebuild:

- **MIDIchlorian — REBUILD PENDING** — intended purpose is MIDI output to an event recorder.

Completed means the module has been rebuilt against the current real-MIDI/timing architecture, has relevant smoke coverage for its rebuilt behavior, and the full CI/build passes. A module must not be marked COMPLETE while its relevant smoke or build is failing. Completed modules leave the pending rebuild queue unless a later dedicated feature/polish pass explicitly reopens them.

## Product design principle

MultiSynth must be an awesome toy for a dabbler and a powerful instrument for a musician. The same patching and performance surface must have a low floor and a high ceiling: a new or casual user should be able to connect modules, twist controls, trigger sounds, build loops, and make something satisfying without understanding the deeper architecture, while an experienced musician must be able to address the same instrument through real MIDI, external controllers, synchronized transport, sequencing, expressive control, routing, recording, arrangement, mixdown, and finished export workflows.

Do not split this into separate beginner and professional modes. The simple surface and the deep system are the same instrument. Advanced capability should emerge naturally from the same controls, modules, patching model, and MIDI contract rather than being hidden behind a different product personality. Every rebuild decision should preserve immediate playability without sacrificing professional depth.

## Global MIDI Rule

Every production module with controllable musical state must be controllable through real MIDI messages. No fake CV control vocabulary, generic trigger packet standing in for a note, or private MIDI-like event type may replace a message already defined by MIDI.

Use standard MIDI semantics wherever they exist: Note On/Off with velocity for notes; Pitch Bend for pitch expression; Poly Pressure or Channel Pressure for pressure; Program Change for program/preset selection; CC64 for sustain; CC7 for volume; CC10 for pan; CC11 for expression; F8 for MIDI Clock; FA for Start; FB for Continue; FC for Stop; and standard channel-mode messages where appropriate. Parameters without a dedicated standard MIDI message receive an explicit MIDI CC mapping. A physical control in the UI changes the same musical state addressed by its MIDI mapping.

Carrier is audio. MIDI is musical control and performance. Clock and transport use real MIDI realtime semantics. Modules may expose audio routing and MIDI behavior simultaneously, but neither is translated into a fake substitute for the other.

Controller names below refer to canonical MultiSynth controls. Default CC assignments may later become MIDI-learnable, but the underlying message remains real MIDI.

## Mandatory rebuild review sequence

Every module is reviewed and rebuilt in this order:

1. Define exactly what the module is supposed to be from the musician's point of view.
2. Review whether the current name is strong, memorable, and actually fits that identity.
3. If the name is weak, propose replacements and agree on one before rebuilding it. A proposed rename does not change repository identity until Nate explicitly approves that specific rename.
4. Define the smallest complete feature set and its real-MIDI behavior. Minimal means no speculative extras; complete means the module performs its intended musical job without placeholders.
5. Assign the simplest appropriate canonical physical controller to every user-facing feature. Do not add module-owned geometry or layout overrides.
6. Define the exact real MIDI messages and CC mappings for every controllable feature, using standard MIDI assignments where they exist and explicit CC assignments where they do not.
7. Rebuild the module cleanly from the floor up against this specification. Do not preserve obsolete pseudo-MIDI, fake CV, generic trigger, compatibility, or parallel event paths merely because the old implementation used them. Reuse canonical controls/prefabs exactly; if they are insufficient, improve the shared library first instead of creating a bespoke module control/layout.
8. Update or add smoke coverage for the module's actual rebuilt runtime, MIDI/event behavior, controls, persistence, timing, routing, and other applicable contract points. Run the full CI/build and fix all failures caused or exposed by the rebuild. Do not mark the module COMPLETE until the relevant smoke coverage and the full build pass.

The design review happens before code changes. Module renames, feature changes, control assignments, and rebuild implementation are approved module-by-module before repository writes. Smoke/build completion is part of the rebuild itself, not a later cleanup pass.

## Hard rename rule

When a module rename is approved, the rename is exhaustive and atomic. Every repository reference to the old module identity is renamed in the same change: display name, canonical module ID, manifest/catalog entries, filenames, script/editor references, surface or package IDs, CSS selectors/themes where identity-bearing, tests, docs, persistence keys or mappings, and any other code or data reference. Do not preserve the old identity through aliases, compatibility mappings, duplicate registrations, fallback names, or transitional shims. After the rename, a repository-wide search for the old name and old identifier must return no live references except historical material that is intentionally outside the active codebase.

---

## +1 Merger — build spec

**Purpose:** Bring several Carrier paths back together into one controllable output. It is a compact routing/mixing utility, not an instrument or timing source.

**MIDI:** CC7 controls master output level. Every active input gets directly MIDI-addressable level, mute, and solo controls using explicit assigned CCs. Program Change may recall stored mix/routing snapshots.

**Controls:** per-input LEVEL — fader; MUTE — switch; SOLO — switch; MASTER — fader; output activity — meter.

**State:** input strip levels/mutes/solos, master level, optional snapshot.

**Behavior:** used-plus-one Carrier inputs; summed Carrier output; no synthesis or private timing.

## +1 Splitter — build spec

**Purpose:** Distribute one Carrier source to several independently controllable destinations while keeping the patch expandable.

**MIDI:** CC7 controls master/source level. Each output receives explicit MIDI CC control for level and mute. Program Change may recall routing/output snapshots.

**Controls:** per-output LEVEL — fader; MUTE — switch; MASTER — fader; output activity — meter.

**State:** per-output level/mute, master level, optional snapshot.

**Behavior:** used-plus-one Carrier outputs; every output derives from the same source signal.

## Alchemy Mixer — build spec

**Purpose:** Main performance mixer for combining multiple Carrier sources into one downstream mix with independent channel control.

**MIDI:** CC7 = master level; CC10 = selected-channel pan; CC11 = selected-channel expression/trim; every channel level, mute, solo, and pan is directly MIDI CC addressable. Program Change recalls mixer scenes.

**Controls:** channel LEVEL — fader; PAN — knob; MUTE — switch; SOLO — switch; channel meter — meter; MASTER — fader; master meter — meter; scene select — encoder/readout.

**State:** channel level/pan/mute/solo, master level, selected scene.

**Behavior:** multiple Carrier inputs mix to one Carrier output; no private automation clock.

## Been Served — build spec

**Purpose:** Turn a continuous incoming Carrier into a playable articulated instrument using a MIDI-controlled ADSR amplitude envelope.

**MIDI:** Note On opens the envelope using velocity; Note Off releases it; CC64 sustains held releases; CC73 = attack; CC75 = decay; CC70 = sustain; CC72 = release; CC11 = expression/output depth; Channel Pressure may scale envelope depth.

**Controls:** ATTACK/DECAY/SUSTAIN/RELEASE — knobs; EXPRESSION — fader; SUSTAIN/HOLD — switch; envelope activity — LED.

**State:** ADSR values, expression level, sustain state.

**Behavior:** real MIDI notes determine articulation; held-note bookkeeping may keep the monophonic Carrier envelope open until appropriate Note Off/Sustain resolution.

## Big Deal — build spec

**Purpose:** Cut source audio into granular pieces and deal those pieces into new playable arrangements, textures, and phrases without becoming a destructive file editor.

**MIDI:** Note On plays generated/dealt material chromatically with velocity; Note Off releases; Pitch Bend changes pitch continuously; CC1 controls grain motion; CC11 expression; assigned CCs control grain size, density, spread, pitch range, reverse probability, shuffle/deal amount, and mix. Program Change recalls deals/programs.

**Controls:** source select — encoder/readout; DEAL/SHUFFLE/REVERSE — buttons; SIZE/DENSITY/SPREAD/PITCH — knobs; MIX — fader; keyboard — performance keyboard; SAVE/EXPORT — button.

**State:** source references, current deal/order, granular parameters, selected program.

**Behavior:** outputs playable Carrier derived from sample material; performance is driven by real MIDI notes and controls.

## Big Mouth — build spec

**Purpose:** Capture changing vocal/formant shape and impose that resonant movement on a separate incoming Carrier so synths or samples can acquire speech-like motion.

**MIDI:** CC1 = formant depth; CC11 = expression/mix; assigned CCs control formant shift, smoothing, speed, freeze, loop, and wet/dry. Program Change recalls formant captures/presets. Note messages may pass through or address the paired instrument path as configured.

**Controls:** CAPTURE — hold button; DEPTH — knob; SHIFT — knob; SMOOTH — knob; SPEED — knob; FREEZE — switch; LOOP — switch; MIX — fader; formant display — screen.

**State:** captured formant-data reference, parameter values, freeze/loop state, preset.

**Behavior:** incoming Carrier is the sound source; captured formants shape it rather than replacing it.

## Bluetooth Output — build spec

**Purpose:** Deliver the finished Carrier chain to a selected Bluetooth or supported Android audio destination with explicit final-level control.

**MIDI:** CC7 = output volume; assigned CC = mute; CC120 = immediate all-sound-off at this terminal; Program Change selects stored output-device profiles where useful.

**Controls:** DEVICE — encoder/readout; LEVEL — fader; MUTE — switch; output meter — meter.

**State:** selected destination, level, mute.

**Behavior:** terminal Carrier output; no synthesis or musical timing generation.

## Control Freak — build spec

**Purpose:** Dedicated hardware-style MIDI performance surface for playing the patch and controlling other modules from one place.

**MIDI OUT:** performance keyboard emits Note On/Off with velocity; pitch control emits Pitch Bend; modulation emits CC1; sustain emits CC64; expression emits CC11; assignable knobs/faders/buttons emit selected real CC messages; pressure-capable controls emit Channel or Poly Pressure; Program Change controls program selection.

**MIDI IN:** receives matching MIDI feedback so controls and readouts can reflect external state where supported.

**Controls:** keyboard — performance keyboard; PITCH — ribbon/XY spring axis; MOD — ribbon/encoder; SUSTAIN — switch/expression-pedal style control; EXPRESSION — expression; assignable continuous controls — knobs/faders; assignable toggles/actions — switches/buttons; assignment display — screen/readout.

**State:** MIDI channel, assignments, ranges, polarity, bank/program selection.

**Behavior:** every generated performance/control event is an actual MIDI message suitable for internal modules and external MIDI hardware/software.

## Denzel's Equalizer — build spec

**Purpose:** Shape Carrier frequency balance so a sound can be made brighter, darker, thinner, heavier, clearer, or fitted into a mix.

**MIDI:** explicit CCs control each exposed band gain, frequency, and Q; CC11 controls overall effect expression; assigned CC controls bypass; Program Change recalls EQ presets.

**Controls:** band GAIN — faders; FREQUENCY — knobs; Q — knobs; BYPASS — switch; input/output — meters.

**State:** band values, bypass, selected preset.

**Behavior:** audio processing remains Carrier; every user-facing parameter is MIDI addressable.

## Echo Canyon — build spec

**Purpose:** Delay incoming Carrier to create anything from one repeat to long feedback trails, operating either freely or in musical sync.

**MIDI:** CC12 = delay time default; CC13 = feedback default; CC11 = wet/dry expression; assigned CCs control sync division, filter/tone, freeze, and bypass. F8 supplies timing when synchronized; FA/FB/FC govern transport-following behavior where required.

**Controls:** TIME — knob; FEEDBACK — knob; MIX — fader; SYNC — switch; DIVISION — encoder/readout; FILTER/TONE — knob; FREEZE — switch; BYPASS — switch.

**State:** delay time/division, feedback, mix, tone, sync/freeze/bypass.

**Behavior:** synchronized delay derives timing from real MIDI clock; it never estimates tempo with a private scheduler.

## Father Time — build spec — COMPLETE

**Purpose:** Represent and control the one authoritative musical timeline for the entire patch and bridge it to real external MIDI clock/transport.

**MIDI IN/OUT:** F8 Timing Clock at 24 PPQN; FA Start; FB Continue; FC Stop. External realtime MIDI can become the authoritative source; internal transport emits the same real messages outward.

**Controls:** BPM — encoder; MIDI CLOCK activity — LED. Father Time is always on and has no RUN/START/STOP front-panel control.

**State:** shared transport BPM plus any persistent clock-source configuration owned by the transport/native MIDI path.

**Behavior:** one timeline only; never a second scheduler. Father Time is the visible master-clock panel and physical MIDI realtime bridge. Multiple Father Time instances share one physical realtime output stream.

## Garage Band — build spec

**Purpose:** Split incoming Carrier into low, mid, and high parallel filter bands, shape each independently, then recombine them for broad tonal sculpting.

**MIDI:** explicit CCs control each band's center frequency, resonance/Q, level, and mute; CC11 controls total expression/mix; assigned CC controls bypass; Program Change recalls setups.

**Controls:** each band FREQ — knob; Q/WIDTH — knob; LEVEL — fader; MUTE — switch; master MIX — fader; BYPASS — switch.

**State:** three band parameter sets, mix, bypass, preset.

**Behavior:** Carrier processor; every front-panel value responds to real MIDI CC.

## Gene Sequencer — build spec

**Purpose:** A simple 32-step monophonic sequencer that records played notes directly into selected steps and outputs a real MIDI sequence. It includes a minimal internal carrier so it is audible by itself while remaining able to feed other instruments.

**MIDI IN:** Note On records note and incoming velocity into the selected step. Note Off ends auditioned notes; CC64 may sustain audition notes. F8/FA/FB/FC supply timing/transport.

**MIDI OUT:** playback emits actual Note On with stored velocity and matching Note Off according to the step's stored length. The stream is usable by internal modules and external MIDI destinations.

**Carrier:** internal sine/saw/square audition oscillator. External Carrier input hard-overrides the internal oscillator; there is no blend.

**Controls:** 32 STEP SELECT — buttons; keyboard — performance keyboard; STEP LENGTH — encoder/knob (1–32); REST/CLEAR — button; LOOP LENGTH — encoder/knob (1–32); DIVISION — encoder/readout; PLAY/STOP — switch or paired buttons; RESET — button; SINE/SAW/SQUARE — exclusive buttons; selected note/velocity — readout; playback position — step LEDs/state.

**State:** 32 records `{note, active, length, velocity}` with velocity default 127; loop length; division; selected step; waveform.

**Behavior:** select a step, play a note, and it is stored immediately. Rest clears that step. Per-step length determines Note Off timing. Playback follows shared real MIDI transport.

## Grain Liqour — build spec

**Purpose:** Turn saved audio into a playable granular MIDI instrument whose grains can be positioned, spread, stretched, layered, and moved while still behaving like a conventional instrument.

**MIDI:** Note On/Off + velocity control voices; Pitch Bend changes pitch; CC1 grain motion; CC11 expression; CC64 sustain; assigned CCs control grain size, density, spread, position, jitter, pitch scatter, envelope, and mix; Program Change selects programs/sample sets.

**Controls:** sample select — encoder/readout; keyboard — performance keyboard; POSITION — ribbon; SIZE/DENSITY/SPREAD/JITTER — knobs; envelope — ADSR prefab; MIX/LEVEL — faders; program — encoder/readout.

**State:** sample reference, granular parameters, envelope, program.

**Behavior:** normal MIDI-playable instrument whose synthesis method happens to be granular.

## Hookworm — build spec

**Purpose:** Capture incoming or recorded audio into a live granular echo/loop path that can stretch, fragment, smear, reverse, and recirculate material during performance.

**MIDI:** assigned CCs control record, loop, grain size, stretch, feedback, smear, speed, reverse, mix, and clear. F8 provides synchronized loop/division operation; FA/FB/FC align transport-aware behavior; Program Change recalls performance presets.

**Controls:** RECORD — hold button; LOOP — switch; CLEAR — button; SIZE/STRETCH/FEEDBACK/SMEAR/SPEED — knobs; REVERSE — switch; DIVISION — encoder/readout; SYNC — switch; MIX — fader.

**State:** loop-buffer reference/state, loop boundaries, processing parameters, sync state, program.

**Behavior:** captured sound remains audio; every performance command is reachable through real MIDI.

## Keyless88 — build spec

**Purpose:** A pitched performance instrument with an alternative interface rather than a conventional piano-key front panel, while still behaving as a normal MIDI instrument.

**MIDI:** Note On/Off with velocity; Pitch Bend; Channel Pressure and/or Poly Pressure where supported; CC1 modulation; CC11 expression; CC64 sustain; assigned CCs for timbral parameters; Program Change presets.

**Controls:** alternative pitch/performance surface — XY/ribbon/pads as appropriate to final identity; expression — expression; modulation — ribbon/knob; sustain — switch; timbre — knobs; level — fader; program — encoder/readout.

**State:** synthesis parameters, controller mode/ranges, program.

**Behavior:** unconventional physical interface, conventional real MIDI semantics.

## Live Wire — build spec

**Purpose:** Acquire external/network audio, hold it locally for reliable use, then perform it like a deck or instrument with seeking, scratching, looping, retriggering, and overlap.

**MIDI:** Note On triggers/retriggers loaded material with velocity; Note Off gates/stops when selected mode requires it; Pitch Bend may scrub/pitch; assigned CCs control play, stop, cue, seek, loop, loop size, speed, level, record, and copy. F8/FA/FB/FC support synchronized playback/looping; Program Change recalls sources/cues.

**Controls:** platter/seek — turntable; PLAY/STOP/CUE — buttons; LOOP — switch; LOOP SIZE — encoder; SPEED — fader; LEVEL — fader; RECORD/COPY — buttons; source browser — screen/encoder.

**State:** source reference, cue/position, loop settings, speed, level, program.

**Behavior:** real media-audio path with real MIDI performance control.

## LOWRIDER LFO — build spec

**Purpose:** Generate slow repeating modulation as real MIDI control data for cyclical sweeps, fades, pulses, and parameter movement.

**MIDI:** F8/FA/FB/FC provide optional synchronized phase/timing. Assigned CCs configure rate/division, depth, waveform, phase, polarity, and reset. Modulation output itself is a configured real MIDI message—normally CC, Pitch Bend, Channel Pressure, or another explicitly selected MIDI message—never fake CV.

**Controls:** RATE/DIVISION — encoder; DEPTH — knob; WAVEFORM — selector buttons/encoder; PHASE — knob; SYNC — switch; RESET — button; DESTINATION MESSAGE/CC — encoder/readout.

**State:** rate/division, waveform, depth, phase, sync, selected output message/controller.

**Behavior:** modulation source emits real MIDI data directly onto the MIDI control path.

## Master of Levels — build spec

**Purpose:** Final gain, drive, saturation, and output-level stage for a Carrier chain.

**MIDI:** CC7 = master volume; CC11 = expression; assigned CCs = drive/saturation and mute/bypass; CC120 = immediate output silence; Program Change recalls master profiles.

**Controls:** DRIVE — knob; GAIN — fader; MASTER — fader; MUTE — switch; output — meter.

**State:** drive, gain, master, mute, profile.

**Behavior:** terminal level/drive processing; no private control protocol.

## MIDIchlorian — build spec — LOW-PRIORITY REBUILD

**Purpose:** MIDI output to an event recorder.

**Status:** Rebuild pending. The current implementation is not considered complete and should be revisited after higher-priority module rebuilds.

## No Quarter — build spec

**Purpose:** Complete electric-piano-like polyphonic MIDI instrument with its own recognizable attack, body, overtone, noise, decay, and ambience character.

**MIDI:** Note On/Off with velocity; Pitch Bend; CC64 sustain; CC11 expression; Channel Pressure may increase bark/drive; assigned CCs control clean, bell, bark, noise, darkness, ambience/water/haunt/crackle character; Program Change presets.

**Controls:** keyboard — performance keyboard; CLEAN/BELL/BARK/NOISE/DARKNESS/AMBIENCE — knobs; release/envelope shaping — knobs as required; SUSTAIN — switch; EXPRESSION/LEVEL — fader; program — encoder/readout.

**State:** tone controls, envelope/release, sustain, level, program.

**Behavior:** complete polyphonic real-MIDI instrument with Carrier output.

## Pulsynth — build spec — COMPLETE

**Purpose:** Playable pulse/PWM synthesizer whose identity comes from pulse width and PWM motion rather than a different control architecture.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC7 level; CC11 expression; CC64 sustain; CC73 attack; CC75 decay; CC70 sustain; CC72 release; Program Change stored in module state. Stage 1 uses CC20–25 for amount, duty, phase, detune, octave, direction; stage 2 uses CC26–31; stage 3 uses CC32–37.

**Controls:** keyboard — performance keyboard; DUTY/PWM — knobs; oscillator AMOUNT/TUNE — knobs; ADSR — prefab; MOD — knob/ribbon; LEVEL — fader; program — encoder/readout.

**State:** synthesis parameters, envelope, program.

**Behavior:** standard MIDI instrument behavior with pulse synthesis as its sound identity.

## PureSynth — build spec — COMPLETE

**Purpose:** Simplest complete conventional MultiSynth voice: basic waveform generation, straightforward shaping, predictable response, and clean reference behavior.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain; assigned CCs control waveform, shape/phase/duty, ADSR, and level; Program Change presets.

**Controls:** waveform choices — exclusive buttons/encoder; SHAPE — encoder; ADSR — prefab; keyboard — performance keyboard; LEVEL/EXPRESSION — fader; program — encoder/readout.

**State:** waveform/shape, envelope, level, program.

**Behavior:** basic complete real-MIDI synthesizer and reference voice.

## QuadSynth — build spec — COMPLETE

**Purpose:** Layer four distinct sound components into one playable synth voice, letting the musician balance and tune the components as a single instrument.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain; every component level/tune/mute/solo is CC-addressable; assigned CCs control shared envelope/tone; Program Change presets.

**Controls:** four component LEVEL — faders; TUNE/OCTAVE — knobs/encoders; MUTE/SOLO — switches; ADSR — prefab; keyboard — performance keyboard; MASTER — fader.

**State:** component settings, shared voice settings, program.

**Behavior:** each incoming MIDI note creates one layered voice using the enabled components.

## Randrone — build spec

**Purpose:** Produce sustained evolving drone material that may run continuously or react to notes and shared timing while retaining a generative character.

**MIDI:** Note On/Off establishes root/voice events; velocity affects intensity; Pitch Bend changes root; CC1 controls generative motion; CC11 expression; assigned CCs control randomness, density, range, drift, hold, and regenerate. F8/FA/FB/FC synchronize event changes when enabled; Program Change presets.

**Controls:** ROOT/PITCH — encoder; RANDOM/DENSITY/RANGE/DRIFT — knobs; HOLD — switch; REGENERATE — button; SYNC — switch; DIVISION — encoder; LEVEL — fader.

**State:** generator parameters, root, sync/division, level, program.

**Behavior:** generative decisions may be internal, but all external musical control is real MIDI.

## Razorback — build spec — COMPLETE

**Purpose:** Aggressive playable synthesizer centered on sharp/movable-peak wave behavior and cutting harmonic character.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC7 level; CC11 expression; CC64 sustain; CC73 attack; CC75 decay; CC70 sustain; CC72 release; Program Change stored in module state. Stage 1 uses CC20–25 for amount, peak, phase, detune, octave, direction; stage 2 uses CC26–31; stage 3 uses CC32–37.

**Controls:** PEAK — knobs; stage/oscillator AMOUNT — knobs; DRIVE/TONE — knobs; ADSR — prefab; keyboard — performance keyboard; LEVEL — fader.

**State:** synthesis parameters, envelope, level, program.

**Behavior:** conventional real MIDI performance with aggressive synthesis defining the sound.

## Rearranger — build spec

**Purpose:** Organize sections from multiple modules into larger song structures and launch those sections in sync during live performance.

**MIDI IN:** F8/FA/FB/FC define timing/transport; Program Change selects or launches sections/songs; mapped MIDI notes may launch section slots; assigned CCs control next/previous/launch/stop and arrangement actions.

**MIDI OUT:** emits the real Note, CC, Program Change, and transport messages required to command participating modules.

**Controls:** section pads — pads; song/section select — encoder/readout; LAUNCH/STOP/NEXT/PREV — buttons; chain editor — screen; quantize/division — encoder.

**State:** section definitions, chains, module MIDI assignments, launch quantization, selected song/section.

**Behavior:** arrangement follows shared MIDI realtime clock and controls modules through real MIDI, never private pseudo-events.

## Sample Library — build spec

**Purpose:** Shared organization and storage for saved audio used by samplers, granular instruments, editors, and other sample-based modules.

**MIDI:** Program Change selects saved sample/library performance programs where mapped; assigned CCs may navigate selection and trigger preview/load within a performance-safe subset. File-management actions may receive explicit MIDI mappings where safe, but storage integrity remains authoritative.

**Controls:** browser — screen; navigation/select — encoder; PREVIEW/LOAD — buttons; file actions — buttons.

**State:** folder/sample organization and current selection.

**Behavior:** storage remains storage; MIDI reaches its controllable surface without turning file operations into a private protocol.

## Sample Surgery — build spec

**Purpose:** Prepare saved audio through explicit sample editing such as trimming, boundary adjustment, gain, audition, and processing before returning material to the library.

**MIDI:** assigned CCs control start/end, zoom/scrub, gain, processing parameters, audition, and save actions; Note On auditions the current sample/slice with velocity; Pitch Bend may scrub audition pitch when enabled; Program Change recalls editing presets rather than destructive file state.

**Controls:** waveform — screen; START/END — ribbons/encoders; SCRUB — turntable/ribbon; GAIN — knob; AUDITION — pad/button; SAVE — button.

**State:** source reference, edit boundaries, processing settings.

**Behavior:** edits remain explicit; MIDI controls the same functions as the front panel.

## SinLadder — build spec — COMPLETE

**Purpose:** Smooth playable synthesizer that builds increasingly complex harmonic tones from sine-based stages arranged as a ladder voice.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC7 level; CC11 expression; CC64 sustain; CC73 attack; CC75 decay; CC70 sustain; CC72 release; Program Change stored in module state. Stage 1 uses CC20–25 for amount, harmonic, phase, detune, octave, direction; stage 2 uses CC26–31; stage 3 uses CC32–37.

**Controls:** stage AMOUNT — knobs; HARMONIC/TUNE — encoders; PHASE — knobs; ADSR — prefab; keyboard — performance keyboard; LEVEL — fader.

**State:** harmonic/stage parameters, envelope, level, program.

**Behavior:** standard real-MIDI instrument semantics with sine/harmonic synthesis identity.

## Stinger — build spec — COMPLETE

**Purpose:** Bright, pointed, fast-edged playable synthesizer emphasizing sharp attacks and cutting harmonic motion.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC7 level; CC11 expression; CC64 sustain; CC73 attack; CC75 decay; CC70 sustain; CC72 release; Program Change stored in module state. Stage 1 uses CC20–25 for amount, acceleration, phase, detune, octave, direction; stage 2 uses CC26–31; stage 3 uses CC32–37.

**Controls:** ACCELERATION/SHAPE — knobs; stage AMOUNT/TUNE — knobs; ADSR — prefab; keyboard — performance keyboard; LEVEL — fader.

**State:** synthesis parameters, envelope, level, program.

**Behavior:** normal real-MIDI voice behavior with Stinger-specific synthesis.

## Tail Gator — build spec

**Purpose:** Explicit terminal routing point for choosing where the finished Carrier signal goes.

**MIDI:** Program Change selects saved output routes/destinations; assigned CC selects destination and mute; CC7 controls output level; CC120 performs immediate silence.

**Controls:** DESTINATION — encoder/readout; LEVEL — fader; MUTE — switch; activity — meter.

**State:** destination, level, mute.

**Behavior:** terminal routing only; every selectable state is MIDI addressable.

## Tapeworm — build spec

**Purpose:** Literal continuously cycling tape-loop machine for capturing, replaying, and manipulating audio as a physical-style loop rather than a clip launcher or granular buffer.

**MIDI:** assigned CCs control record, overdub if retained, play, stop, clear, reverse, speed, feedback, loop level, and splice/loop length. F8/FA/FB/FC synchronize transport when enabled; Pitch Bend may provide momentary tape-speed bend/scrub; Program Change recalls loop-performance setups.

**Controls:** RECORD — hold button; PLAY/STOP — buttons; CLEAR — button; SPEED — fader/turntable; REVERSE — switch; LOOP LENGTH — encoder; FEEDBACK — knob; LEVEL — fader; tape position — readout/screen.

**State:** loop audio/buffer state, loop length, speed, reverse, feedback, sync.

**Behavior:** continuous circular tape playback controlled directly through real MIDI.

## TEST MODULE — build spec

**Purpose:** Development harness that proves every canonical control, gesture, binding, visual variant, and real-MIDI mapping without becoming a production musical module.

**MIDI:** each control is assigned a legitimate MIDI message appropriate to its type: CC for continuous/toggle controls, Note messages for pads/keyboard, Pitch Bend for pitch controls, pressure messages for pressure controls, Program Change where relevant, realtime messages for timing indicators. Raw received and generated MIDI status/data must be visible for verification.

**Controls:** one canonical example of every control family plus readouts/screens for generated and received MIDI.

**State:** test bindings and selected test modes only.

**Behavior:** verifies canonical controls and MIDI mapping; never invents a substitute protocol for testing convenience.

## The Chopper — build spec

**Purpose:** Turn longer recordings into reusable MIDI-playable slices with editable boundaries, pitch, level, direction, and choke behavior.

**MIDI:** slice slots map to real Note On/Off with velocity; Pitch Bend affects active-slice pitch where enabled; CC11 expression; assigned CCs control selected slice, start/end, pitch, level, choke group, and reverse; Program Change recalls chop maps.

**Controls:** waveform/slice display — screen; slice pads — pads; START/END — encoders/ribbons; PITCH — knob; REVERSE — switch; LEVEL — fader; SAVE — button.

**State:** source reference, slice boundaries/settings, note map, program.

**Behavior:** every playable chop is a genuine MIDI note destination.

## Time Bandits — build spec — COMPLETE

**Purpose:** Sixteen-voice, 32-step drum machine that supports direct MIDI performance and synchronized pattern programming through the same note path.

**MIDI IN:** Notes 36–51 trigger the 16 voices with velocity; Note Off may choke/stop voices where appropriate; assigned CCs control voice and selected-step parameters; F8/FA/FB/FC govern sequencer timing/transport; Program Change recalls kits/patterns.

**MIDI OUT:** internal sequencing emits the same actual Note On/Off messages used by external performance, including stored velocity. Ratchets are multiple real Note On/Off events rather than private retrigger calls.

**Controls:** 16 voice pads; Whitman-style 32-step selected-voice pattern bank; RUN PATTERN; SWING; LENGTH; drum-specific synthesis and advanced step controls remain separate from the common pattern UI.

**State:** drum/voice settings, 32-step pattern data, shared pattern length, selected voice, advanced per-step drum-machine data where applicable.

**Behavior:** manual play, external MIDI, and sequencer playback converge on one real MIDI note receiver. Internal timing follows Whitman's scheduled-pulse pattern: shared PatchTransport lookahead, six F8 pulses per sixteenth, and no private/main-thread live-F8 sequencer scheduler.

## Unstable Diffusion — build spec

**Purpose:** Experimental playable instrument that turns generated or sampled material into unstable, evolving sound while retaining ordinary instrument performance semantics.

**MIDI:** Note On/Off + velocity; Pitch Bend; CC1 modulation; CC11 expression; CC64 sustain where appropriate; assigned CCs control diffusion, instability, smear, source blend, density, chaos/feedback, and envelope; Program Change presets.

**Controls:** DIFFUSION/INSTABILITY/SMEAR/DENSITY/CHAOS — knobs; SOURCE/MIX — fader; ADSR — prefab where voice-gated; keyboard — performance keyboard; program — encoder/readout.

**State:** generation/processing parameters, envelope where used, program.

**Behavior:** unusual sound engine, ordinary real-MIDI performance contract.

## Whitman Sampler — build spec — COMPLETE

**Purpose:** Sixteen-slot performance sampler whose slots can be played manually, externally, or by synchronized sequencing through one shared MIDI note behavior.

**MIDI IN:** Notes 36–51 trigger sample slots with velocity; Note Off stops/gates according to slot mode; assigned CCs control selected slot parameters; F8/FA/FB/FC provide transport semantics; Program Change may recall banks/patterns.

**MIDI OUT:** internal sequencing emits actual Note On/Off for slots rather than invoking a private trigger path.

**Controls:** 16 sample pads; 32 sequencer steps; RUN PATTERN; SWING; LENGTH; selected-slot pitch, level and stereo controls.

**State:** sample assignments, slot settings, note map, 32-step pattern data, pattern length, transport-following sequencer state.

**Behavior:** manual pad play, external MIDI, and internal sequencing converge on the same real MIDI note handling. Internal patterns are driven by `PatchTransport.subscribeScheduledPulse()` lookahead, with six F8 pulses per sixteenth and sample starts scheduled to future AudioContext timestamps. Live incoming external F8 remains live because future external pulses cannot be predicted.
