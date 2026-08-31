# MultiSynth Design Document

## 1. Design intent

MultiSynth should feel like a collection of real electronic instruments connected together on a dark patch bench.

The phone is not presenting a generic software dashboard. It is presenting tactile musical equipment.

The design must satisfy three conditions at the same time:

1. the modules actually perform their named musical job;
2. recurring controls behave consistently everywhere;
3. each module has a believable physical identity of its own.

A failure in any one of those three areas means the module is unfinished.

## 2. Physical-believability rule

Every module should answer a simple visual question:

**Could this plausibly be manufactured as a real instrument or effects box?**

That does not require photorealism. It requires coherent physical logic.

A believable device has:

- a faceplate with intentional proportions;
- controls placed where a human hand could use them;
- sensible grouping and labeling;
- consistent hardware sizes;
- enough spacing to avoid accidental touches;
- visual hierarchy between primary and secondary controls;
- materials, borders, fasteners, bezels, recesses, shadows or other cues that imply construction;
- jacks that appear mounted to the panel rather than floating beside it;
- displays and indicators that appear integrated into the device;
- no unexplained overlap or web-layout artifacts.

The goal is not skeuomorphism for its own sake. The physical metaphor exists because it makes a modular synthesizer legible and playable.

## 3. Canonical visual source

The restart does **not** treat the current `alt` control renderer as a visual reference.

The visual reference for shared controls is the best hardware language already present on `main`, especially the control work in `rack-ui-primitives.js` and `rack-instrument-theme.css`.

The useful qualities to preserve are:

- compact controls rather than giant generic cards;
- convincing radial knob faces with depth and material shading;
- the numeric value physically integrated into the knob face;
- a clear indicator/tick on the same face;
- tactile buttons, pads, faders, ribbons and displays that look mounted into equipment;
- restrained borders, recesses, shadows and glows that imply real construction;
- module identity expressed through a small coherent palette rather than one-off CSS for every element.

When old implementation code is removed, these visual ideas are extracted and reimplemented cleanly. They are not discarded merely because the surrounding old architecture is being replaced.

## 4. Four-color theme contract

Every module owns a theme.

A module theme starts from four semantic colors:

- `background` — the deepest chassis/cavity color;
- `panel` — the primary faceplate/material color;
- `accent` — the active/identity color;
- `text` — the primary labeling/readout color.

Everything else should normally be derived from those four colors: secondary panel shade, edge/trim, dim text, track color, knob body, screen color, shadows and active glow.

A module may override a derived material value when its physical identity genuinely requires it, but the normal case is four authored colors plus derived hardware treatment.

The theme belongs to the module, not to the primitive. A knob is the same shared knob implementation in every module, but it renders through the owning module's theme.

This keeps themes coherent while still allowing radically different instruments. PureSynth can be stark black/white; QuadSynth amber/gold; Pulsynth green; SinLadder cyan; Razorback red/black; Stinger yellow/black; No Quarter blue/silver without inventing a separate control system for each.

## 5. Primitive authoring model

The central authoring model is:

**small reusable primitives -> authored module -> themed playable device**

A module is not handwritten from raw WebAudio and arbitrary DOM. It is assembled from a compact vocabulary of reusable signal and interface primitives.

### Signal/DSP primitives

The initial primitive vocabulary should include at least:

- oscillator;
- noise source;
- constant/CV source;
- gain/VCA;
- filter;
- envelope/ADSR;
- mixer/summer;
- delay;
- clock/timer;
- divider/multiplier;
- sampler/buffer player;
- recorder;
- analyser/scope tap;
- Carrier input/output;
- CV input/output.

These are intentionally low-level enough to build new instruments and processors, but high-level enough that a module author does not recreate basic WebAudio plumbing every time.

A primitive exposes its real inputs, outputs and parameters. It does not invent fake controls. If an oscillator has frequency, detune and waveform, those are actual primitive parameters that may be bound to module controls or other graph signals.

### Interface primitives

The interface vocabulary should include:

- knob;
- dial;
- toggle;
- momentary button;
- selector/button bank;
- fader;
- fader bank;
- ribbon;
- pad and pad bank;
- step/sequencer control;
- XY pad;
- joystick;
- touchscreen;
- turntable/scrub control;
- LED and LED ring;
- text/readout/display;
- screen/oscilloscope;
- performance keyboard;
- Carrier jack;
- CV jack.

The same primitive may be reused thousands of times. It has one implementation, one interaction model and one visual construction.

### Binding primitives together

A module author connects primitives explicitly.

Examples:

- knob -> oscillator frequency;
- ADSR -> VCA gain;
- oscillator -> filter -> VCA -> Carrier OUT;
- Father Time clock output -> sequencer clock input;
- screen -> analyser tap;
- performance keyboard -> synth note/gate input.

The module definition therefore describes both the sound/control circuit and the physical face that controls it.

The authoring system must not infer hidden DSP merely because a knob is present, and it must not generate a generic face merely because DSP primitives are present.

## 6. Shared control language

The control library is unified.

A knob should feel like the same family of knob wherever it appears. A jack should behave like the same kind of jack everywhere. A fader should use the same touch mechanics across modules.

Shared means behavior, proportions and craftsmanship, not identical presentation context.

### Knob standard

The canonical knob is based on the successful `main` construction:

- label outside/above the hardware as needed by the module composition;
- one circular hardware face;
- indicator/tick physically on that face;
- numeric value integrated into the face itself, not placed in a separate textbox beneath it;
- radial material shading and edge treatment that reads as a manufactured control;
- direct touch/drag response;
- external state updates redraw the same knob face immediately.

A separate rectangular readout below every knob is specifically not the standard.

Modulation jacks also must not force every knob into a huge vertical card. A patchable parameter may have nearby or integrated jack hardware while still participating in a compact designed control group.

## 7. Module definition

A module definition owns five things together:

1. identity/name;
2. four-color theme;
3. primitive circuit;
4. authored face composition;
5. canonical serializable state.

The runtime is produced from that definition. There should not be a second implementation that attempts to imitate it.

A useful simplified shape is conceptually:

```text
module
  identity
  theme { background, panel, accent, text }
  circuit
    primitives
    connections
  face
    controls/screens/performance surfaces
    layout/grouping
    bindings to primitive parameters/actions
  state
```

This is a conceptual contract, not a mandated serialization format yet.

## 8. Module composition

There is no universal generated module face.

A module definition explicitly composes its shared controls into a face that suits the device.

Useful composition patterns include:

- horizontal control rows;
- grouped oscillator strips;
- mixer channels;
- parameter banks;
- central hero dial with satellite controls;
- left/right signal-flow layouts;
- pad or step matrices;
- scopes/screens above supporting controls;
- keyboard performance area below synthesis controls;
- scrollable setup sections separated from fixed performance sections.

The face can be wider or taller when the device needs the space. Internal scrolling is acceptable. Overlap is not.

Controls must never be mechanically stacked simply because that was easiest for a renderer.

## 9. Performance surfaces

Performance controls have priority over configuration controls.

For a keyboard synth, the keyboard must be immediately reachable.

The desired shared performance-keyboard behavior includes:

- multitouch polyphonic key presses;
- slide from key to key while held;
- velocity derived from a deliberate control/gesture;
- expression control;
- continuous pitch ribbon or equivalent pitch surface;
- octave shifting;
- horizontally navigable full-range keybed;
- portrait and landscape presentations designed for actual fingers.

Earlier experiments targeted the full piano range MIDI 21–108 and roughly 25 visible notes in portrait / 49 in landscape. Those are useful reference values, not sacred geometry.

A drum machine should similarly prioritize pads/steps and transport. A sampler should prioritize sample interaction. A mixer should prioritize channels and levels.

## 10. Visual families

The modules should look related enough to belong to one product, but distinct enough to recognize instantly.

Shared product traits can include:

- common jack construction;
- consistent typography rules;
- related edge treatment and fastener language;
- common touch feedback;
- common cable style;
- common control proportions;
- the canonical knob/dial family and integrated value treatment.

Individual modules then establish identity through face material, the four-color theme, layout and device-specific details.

Strong identities worth preserving from the previous project direction include:

- PureSynth: stark black-and-white precision instrument;
- QuadSynth: amber/gold additive machine;
- Pulsynth: vivid green pulse/PWM hardware;
- SinLadder: cyan harmonic laboratory instrument;
- Razorback: aggressive red/black industrial synthesizer;
- Stinger: yellow/black sharp transient/click machine;
- No Quarter: blue/silver electric-piano instrument with a more polished musical feel;
- Beat Red: unmistakably red rhythm machine;
- Father Time: clock/timing hardware with brown, brass or aged-instrument character;
- LOWRIDER LFO: low-frequency modulation device with strong gold identity;
- Hookworm and Tapeworm: distinct loop/echo machines rather than generic effect panels.

These are design directions, not exact CSS specifications.

## 11. Patch field

The patch field should resemble a dark workbench or modular synth surface.

Requirements:

- dark unobtrusive background;
- optional subtle grid/reference texture;
- modules visually separated from the field;
- obvious mounted input/output jacks;
- curved/drooping physical-looking cables;
- darker plug ends seated into jack centers;
- cable colors varied enough to trace signal paths without becoming noisy;
- touch-friendly cable/jack targets;
- coherent pan/zoom for modules and cables;
- no app-toolbar/module-title collisions;
- safe-area handling on Android devices.

The patch graph is for patching. It is not the place to edit the internal visual layout of a module.

## 12. Carrier and CV

Carrier and CV are distinct signal types.

Carrier is the audio path.

CV carries control/timing relationships. Internally, CV may need both continuous values and event/clock/trigger semantics. The implementation must model those honestly instead of assuming a connected AudioNode automatically implements every kind of CV behavior.

Tempo-capable controls may participate in a shared tempo relationship. When two tempo-aware devices are intentionally linked, changing either tempo control should update the linked tempo state consistently.

The visible cable may still have a source and destination even when the specific semantic relationship is bidirectional synchronization.

## 13. Output mixer

The output mixer is real infrastructure, not a placeholder module.

It owns the final device connection.

Its channel/input face should behave like believable mixer hardware and expand with use.

Rule: the number of visible inputs is always the number currently used plus one available input.

No other normal module silently reaches the device destination.

## 14. Functional-module rule

A named module cannot ship as a generic approximation of itself.

If Beat Red is present, it must perform the Beat Red drum-machine behavior.

If Father Time is present, it must perform its timing/CV role.

If a synth is present, its actual synthesis model and note behavior must exist.

If a module is not ready, it should be marked unfinished or withheld from the playable catalog.

A pretty face with fake DSP fails. Correct DSP with a broken/unusable face also fails.

## 15. State and persistence

The same state drives UI, DSP and persistence.

Changing a control updates the owning module state and runtime. Incoming modulation that changes a visible parameter must update the visible control when that parameter is semantically linked.

Reloading a patch should restore:

- the same modules;
- their positions;
- their actual parameter values;
- their cables;
- relevant sequencer/pattern/sample state;
- the graph camera;
- any meaningful face state.

The restored patch should be immediately playable.

## 16. First implementation gate

Do not begin by recreating every historical module.

Build one complete reference instrument first using only the new primitive vocabulary.

The first reference slice must contain:

1. one visually approved playable synth;
2. one authored four-color module theme;
3. oscillator, VCA/envelope and output primitives sufficient for its real sound;
4. the shared controls it actually needs, beginning with the canonical main-style knob/dial;
5. a real shared performance keyboard;
6. real note-on/note-off DSP;
7. Carrier OUT;
8. output mixer with its dynamic spare input;
9. visible patch cable between synth and mixer;
10. audible device output;
11. save/reload persistence;
12. the same patch still playable after reload.

Only after that reference slice is both beautiful and correct should additional primitive families and modules be added.

## 17. Design review gate

Before calling any module complete, verify all of the following on an actual phone-sized viewport:

- It looks intentional rather than generated.
- It resembles plausible hardware.
- Its primary job is visually obvious.
- Its module theme is distinct and coherent.
- It is composed from shared primitives rather than reimplementing them.
- Its primitive bindings correspond to real DSP/control behavior.
- Its main controls fit the hand and are reachable.
- Its performance surface is present and usable.
- Knobs use the canonical integrated-value hardware treatment unless the control genuinely requires another form.
- The four-color theme reads coherently across faceplate and controls.
- No controls overlap.
- No fixed footer/header covers controls.
- Scrolling, if used, feels deliberate.
- Its controls visibly reflect state.
- Its controls really affect DSP/runtime behavior.
- Its jacks really patch.
- Its output is audible where expected.
- Save/reload reproduces the instrument correctly.

Passing CI is necessary but does not satisfy this review by itself.
