# Rearranger Design Canon

Status: active design canon for the MultiSynth Rearranger.

This document replaces prior Rearranger concepts and is the source of truth for future Rearranger work. The current runtime files remain implementation scaffolding and must converge on this design rather than preserving obsolete behavior.

## Identity

Rearranger is a **loop-based arranger with a hardware-style interface**.

The interaction target is the direct loop/event arrangement workflow associated with classic ACID-style arranging, expressed as a compact hardware instrument rather than a desktop DAW.

Rearranger does not duplicate jobs already owned by other MultiSynth modules. Existing synths, drum machines and other sources create material. Rearranger captures, stores, edits, places, repeats and organizes that material.

## Core loop types

Rearranger has two first-class loop types.

### MIDI loop

A MIDI loop contains musical performance data independently of a sound source:

- note/pitch
- onset/timing
- duration
- velocity
- applicable controller/automation data

A MIDI loop may exist and be edited with **no carrier source assigned**. Source binding is separate from musical content. A user may therefore sketch a part before choosing a sound, or change the source of an existing part without rebuilding its notes or arrangement.

### Audio loop

An audio loop contains recorded/rendered sound.

It supports timeline operations appropriate to recorded material, including placement, trim, slip/alignment and repetition.

At the structural arrangement level MIDI loops and audio loops are peers.

## Source versus instance

A loop is source material. Placement on the timeline is an **instance/event referencing that loop**, not a destructive copy of the source.

This distinction permits the same loop to occur repeatedly while individual occurrences carry placement or variation information.

Core timeline operations are expected to grow from a small primitive set:

- place
- move
- trim
- slip
- repeat
- split
- make unique when an occurrence must diverge
- group

The timeline must not assume that the beginning of recorded audio is necessarily its musical downbeat. Audio material needs an alignable musical anchor so content can be slipped beneath its arrangement position until the groove lands correctly.

## Arrangement hierarchy

The structural model is:

**Loop instances -> Section -> Stanza -> Song**

### Section

A Section is an arrangement of loop instances that belong together.

### Stanza

A Stanza is a reusable song-level unit composed of one or more Sections.

Any part of a song that plays more than once is naturally represented as a Stanza. A one-off passage does not need pointless wrapping: the Song may reference a Section directly.

### Song

A Song is an ordered arrangement of Stanzas and/or direct one-off Sections.

A Stanza may occur multiple times in the Song. Occurrences are enumerated so repetition can remain one reusable Stanza while allowing occurrence-specific variation.

Conceptually:

    INTRO SECTION
    VERSE[1]
    CHORUS[1]
    VERSE[2]
    CHORUS[2]
    BRIDGE SECTION
    CHORUS[3]
    OUTRO SECTION

Enumeration is the variation layer; it should not require silently duplicating the underlying Stanza.

## Perform

Perform is not another nesting level.

**PERFORM = arrangement playback + live throughput.**

The arranged material continues playing while live incoming performance/control can pass through. The keyboard therefore remains a live instrument surface during playback.

## Hardware interface

The Rearranger should look and behave like dedicated hardware, not a miniature desktop DAW.

### Pinned foreground surfaces

The module uses the established MultiSynth pinned performance surfaces:

- scope pinned at the top foreground
- keyboard controller pinned at the bottom foreground

These are not rows consumed from the Rearranger working surface.

### Readout

The Rearranger readout is **8 rows x 24 characters** with extra-bold segments at the Rearranger module level.

It is primarily a compact timeline viewport, not merely a status/menu display.

Twenty-four horizontal cells provide a practical working span: at measure scale they can represent up to twenty-four measures; at sixteenth-note scale a complete measure still fits.

The display can show multiple loop lanes plus ruler, playhead, selection and status information. The visible lanes are a viewport into a potentially larger arrangement; the arrangement itself is not limited to the number of lanes visible simultaneously.

### Reel-style encoder pair

Two prominent encoders evoke a reel-to-reel editing relationship.

They are not arbitrary spare knobs. Their stable semantic relationship is:

- **left encoder:** beginning / backward / navigation side
- **right encoder:** ending / forward / editing side

Exact functions are context-sensitive while preserving that left/right relationship.

Examples include:

- START / END
- IN / OUT
- previous / next
- navigate / edit

For loop trimming, left controls the start boundary and right controls the end boundary.

### Four context knobs

Four smaller knobs form the general musical parameter strip.

They are context-sensitive and may expose parameters such as:

- level
- pan
- filter
- ADSR
- sends
- pitch
- rate
- probability
- other parameters genuinely relevant to the selected material/source

These knobs manipulate musical behavior. They are not substitutes for the reel pair's structural/timeline editing role.

## Working modes

Rearranger borrows the useful job-oriented idea of hardware grooveboxes/workstations without recreating their instruments internally.

The working jobs include:

- SYNTH
- DRUM
- TAPE
- MIXER

These are views/jobs over module material, not duplicate synth, drum-machine or mixer implementations.

For example, DRUM material may originate in Time Bandits, be captured as a loop, then be moved/slipped across the Rearranger timeline until it aligns correctly.

TAPE is the direct loop/timeline workspace: recorded material becomes tangible arrangement events that can be placed, moved, trimmed, slipped, repeated and organized.

Arrangement contexts include:

- CLIP / LOOP
- SECTION
- STANZA
- SONG
- PERFORM

The same physical controls rebind contextually rather than spawning unrelated one-off control implementations.

## Timing

Rearranger does **not** own an independent musical clock.

`PatchTransport` is the sole internal timing authority for the application. Rearranger consumes the shared real-MIDI transport semantics:

- F8 Timing Clock at 24 PPQN
- FA Start
- FB Continue
- FC Stop

Internal arrangement playback, quantized launches and loop scheduling derive from the same shared transport/subdivision stream used by other timing-aware modules. When precise internal scheduling is required, Rearranger uses transport lookahead/scheduled pulse timing rather than a private main-thread timer.

External MIDI clock enters the same `PatchTransport`; Rearranger follows the resulting effective timeline rather than deriving a separate BPM from a private CV/tick path.

### Dedicated timing strip

A dedicated timing strip sits at the bottom of the Rearranger working surface, immediately above the pinned keyboard:

**TAP PAD | TAP / TEMPO LED / BPM | 3-DIGIT BPM READOUT | BPM KNOB**

These controls address the shared patch transport rather than an internal Rearranger clock:

- The TAP pad updates the shared transport BPM from repeated taps.
- The tempo LED reflects the shared beat timeline.
- The three-digit BPM readout shows the effective shared BPM.
- The BPM knob writes the shared transport BPM.
- When external MIDI realtime is authoritative, the readout reflects that effective transport tempo/position rather than starting a second clock.
- This timing strip is dedicated and does not change meaning with Rearranger context.

## MIDI behavior

Rearranger is a real-MIDI arranger.

- MIDI loop playback emits actual Note On/Off, velocity, CC, Pitch Bend, Program Change and pressure messages represented by the loop data.
- Section/song launch controls receive explicit real MIDI mappings.
- Program Change may select sections/songs or recall arrangement states where agreed.
- Mapped notes/pads may launch section slots.
- Internal arrangement events use the same real MIDI receiver paths used by external performance wherever applicable.
- No private trigger/CV event vocabulary is introduced for arrangement playback.

## Design rules

1. Keep musical content separate from sound-source assignment where applicable.
2. MIDI loops remain valid and editable without a carrier source.
3. Audio and MIDI loops share the same structural arrangement model.
4. Reuse loop sources through timeline instances rather than destructive duplication.
5. Preserve Section/Stanza/Song semantics; do not collapse Stanza into Section.
6. Allow direct one-off Sections in Songs.
7. Use enumeration for repeated Stanza occurrences and their variations.
8. Perform means playback plus live throughput.
9. Existing modules create material; Rearranger arranges it.
10. Use canonical MultiSynth controls and default styling unless a genuinely missing primitive is identified.
11. Preserve the reel pair's left/right editing semantics across contexts.
12. Use the shared real-MIDI transport; do not create a Rearranger-local clock or CV timing path.
