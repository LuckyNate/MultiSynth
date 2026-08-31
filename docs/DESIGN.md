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

A believable device has a faceplate with intentional proportions, controls placed where a human hand could use them, sensible grouping and labeling, consistent hardware sizes, enough spacing to avoid accidental touches, visual hierarchy between primary and secondary controls, materials/borders/bezels/recesses/shadows that imply construction, mounted jacks, integrated displays, and no web-layout artifacts.

The physical metaphor exists because it makes a modular synthesizer legible and playable.

## 3. Canonical visual source

The restart does not treat the current `alt` control renderer as a visual reference.

The visual reference for shared controls is the best hardware language already present on `main`, especially the control work in `rack-ui-primitives.js` and `rack-instrument-theme.css`.

Preserve the compact hardware treatment, radial knob faces, integrated numeric value on the knob face, tactile switches/pads/faders, mounted displays/jacks, restrained shadows/glows, and coherent per-module palettes.

## 4. Four-color theme contract

Every module owns a theme with four semantic colors:

- `background` — deepest chassis/cavity color;
- `panel` — primary faceplate/material color;
- `accent` — active/identity color;
- `text` — primary labeling/readout color.

Everything else is normally derived from those four colors. Theme generation and editing are specified separately in `THEME_AUTHORING.md`.

The theme belongs to the module, not to the primitive. A knob is the same shared knob implementation in every module, but it renders through the owning module's theme.

## 5. Two graph architecture

MultiSynth has exactly two graph spaces with different jobs and incompatible node vocabularies.

### 5.1 Patch Graph

The Patch Graph is the user's main performance/composition workspace.

Its interaction model should feel like PureRef: a large freeform board with direct manipulation, smooth pan and zoom, minimal chrome, and objects that can be scattered spatially without a rigid layout system.

The Patch Graph accepts only complete module instances.

A module node is the actual themed device face. It is not a generic rectangular graph card representing some hidden editor.

The Patch Graph does not expose primitive oscillators, filters, gains, knobs, screens, envelopes, or other construction parts.

Patch Graph responsibilities:

- place module instances;
- move modules freely;
- select one or many modules;
- pan and zoom the board;
- connect external Carrier/CV jacks with visible physical cables;
- delete/duplicate modules as module instances;
- preserve module state, positions, cables and camera state;
- remain visually quiet so the module hardware dominates.

Module position has no routing meaning. Routing exists only through explicit cables.

### 5.2 Module Builder Graph

The Module Builder is a separate construction environment for creating or editing one module.

It accepts only primitives.

Primitives include both DSP/signal parts and interface/control parts. The builder lets the author explicitly connect those parts into the module's circuit and explicitly compose the module's physical face.

Finished modules cannot be inserted as nodes inside the Module Builder.

The Module Builder's output is one complete module definition containing identity, theme, state, primitive circuit, external ports, control bindings and authored face composition.

That compiled module then becomes one placeable node in the Patch Graph.

### 5.3 Hard separation rule

**Primitives never appear directly in the Patch Graph. Finished modules never appear as primitive nodes in the Module Builder.**

The two node classes cannot be mixed in one graph document.

This is a deliberate architecture boundary, not a UI filter.

## 6. Primitive authoring model

The central authoring model is:

**small reusable primitives -> Module Builder -> authored module -> themed playable device -> Patch Graph**

A module is assembled from a compact vocabulary of reusable signal and interface primitives.

### Signal/DSP primitives

The initial vocabulary should include at least oscillator, noise source, constant/CV source, gain/VCA, filter, envelope/ADSR, mixer/summer, delay, clock/timer, divider/multiplier, sampler/buffer player, recorder, analyser/scope tap, Carrier input/output, and CV input/output.

A DSP primitive exposes real inputs, outputs and parameters. It does not invent fake controls.

### Interface primitives

The initial interface vocabulary should include knob, dial, toggle, momentary button, selector/button bank, fader, fader bank, ribbon, pad/pad bank, step/sequencer control, XY pad, joystick, touchscreen, turntable/scrub control, LED/LED ring, text/readout/display, screen/oscilloscope, performance keyboard, Carrier jack and CV jack.

The same primitive may be reused thousands of times. It has one implementation, one interaction model and one visual construction.

### Binding primitives together

The module author explicitly connects and binds primitives. Examples include knob -> oscillator frequency, ADSR -> VCA gain, oscillator -> filter -> VCA -> Carrier OUT, screen -> analyser tap, and performance keyboard -> synth note/gate input.

The authoring system must not infer hidden DSP merely because a control exists, and it must not generate a generic module face merely because DSP primitives exist.

## 7. Shared control language

The control library is unified.

A knob should feel like the same family of knob wherever it appears. A jack should behave like the same kind of jack everywhere. A fader should use the same touch mechanics across modules.

Shared means behavior, proportions and craftsmanship, not identical presentation context.

### Knob standard

The canonical knob is based on the successful `main` construction:

- label outside/above the hardware as needed;
- one circular hardware face;
- indicator/tick physically on that face;
- numeric value integrated into the face itself;
- radial material shading and edge treatment;
- direct touch/drag response;
- external state updates redraw the same knob face immediately.

A separate rectangular readout below every knob is not the standard.

Patchable parameters may have nearby or integrated jack hardware without forcing every control into a huge generic card.

## 8. Module definition

A module definition owns:

1. identity/name;
2. four-color theme;
3. primitive circuit;
4. authored face composition;
5. external module ports;
6. canonical serializable state.

Conceptually:

```text
module
  identity
  theme { background, panel, accent, text }
  circuit
    primitives
    connections
  face
    controls/screens/performance surfaces
    authored layout/grouping
    bindings
  ports
    external Carrier/CV/public jacks
  state
```

The runtime is produced from that definition. There should not be a second implementation that attempts to imitate it.

## 9. Module composition

There is no universal generated module face.

A module definition explicitly composes shared controls into a face that suits the device.

Useful patterns include horizontal control rows, grouped oscillator strips, mixer channels, parameter banks, central hero dials, signal-flow layouts, pad/step matrices, scopes/screens, keyboard performance areas and deliberate scrollable configuration sections.

Controls must never be mechanically stacked merely because that is easiest for a renderer.

## 10. Performance surfaces

Performance controls have priority over configuration controls.

For a keyboard synth, the keyboard must be immediately reachable. It should support useful multitouch behavior, sliding notes, expression/velocity strategy, pitch interaction and octave navigation where appropriate.

A drum machine should prioritize pads/steps and transport. A sampler should prioritize sample interaction. A mixer should prioritize channels and levels.

## 11. Visual families

Modules should look related enough to belong to one product, but distinct enough to recognize instantly.

Shared product traits include common jack construction, typography rules, edge/fastener language, touch feedback, cable style, control proportions and the canonical knob treatment.

Individual modules establish identity through face material, four-color theme, layout and device-specific details.

Strong identities worth preserving include PureSynth black/white, QuadSynth amber/gold, Pulsynth green, SinLadder cyan, Razorback red/black, Stinger yellow/black, No Quarter blue/silver, Beat Red red, Father Time aged brass/brown, LOWRIDER LFO gold, and distinct Hookworm/Tapeworm loop-machine identities.

## 12. Patch Graph visual behavior

The Patch Graph should feel more like a reference board than a conventional engineering node editor.

Requirements:

- large freeform canvas;
- smooth continuous pan;
- smooth zoom around the gesture/focus point;
- direct module dragging;
- optional marquee/multi-selection;
- free spatial arrangement with no automatic layout pressure;
- modules retain their authored proportions and appearance;
- no generic wrapper card visually replacing the module;
- physical-looking cables connecting mounted jacks;
- cables transform with the same board camera;
- minimal persistent toolbar/chrome;
- dark unobtrusive background;
- safe-area handling on Android.

The board may use an internal world coordinate system much larger than the screen. It should feel effectively unbounded to the user without requiring actual infinite numeric coordinates.

## 13. Carrier and CV

Carrier and CV are distinct signal types.

Carrier is the audio path.

CV carries control/timing relationships. Internally, CV may need both continuous values and event/clock/trigger semantics. The implementation must model those honestly.

Tempo-aware relationships may synchronize bidirectionally where explicitly defined even though a visible cable has source/destination geometry.

## 14. Output mixer

The output mixer is real infrastructure and one complete module on the Patch Graph.

It owns the final device connection. Its face should behave like believable mixer hardware and expand with use.

The number of visible inputs is always the number currently used plus one available input.

No other ordinary module silently reaches the device destination.

## 15. Functional-module rule

A named module cannot ship as a generic approximation of itself.

If Beat Red is present, it must perform Beat Red drum-machine behavior. If Father Time is present, it must perform its timing/CV role. If a synth is present, its actual synthesis model and note behavior must exist.

A pretty face with fake DSP fails. Correct DSP with a broken/unusable face also fails.

## 16. State and persistence

The same canonical module state drives UI, DSP and persistence.

Patch Graph persistence includes module instances, module positions, module state, graph camera, cables and referenced assets.

Module Builder persistence includes the in-progress module's primitive graph, authored face composition, theme, bindings, external ports and state defaults.

Reloading a patch should reconstruct the same playable instrument, not merely the same drawing.

## 17. First implementation gate

Do not begin by recreating every historical module.

Build one complete reference path:

1. Module Builder with the minimum useful primitive vocabulary;
2. one visually approved playable synth authored entirely from those primitives;
3. one authored four-color theme;
4. canonical main-style knobs;
5. real performance keyboard;
6. real note-on/note-off DSP;
7. compile/save the result as one finished module;
8. place that module on the PureRef-style Patch Graph;
9. place the output mixer as another module;
10. patch synth Carrier OUT to mixer input;
11. produce audible device output;
12. save/reload;
13. verify the same patch remains playable.

Only after that path is beautiful and correct should additional module families return.

## 18. Design review gate

Before calling a module complete, verify it looks intentional and plausibly manufactured, its primary job is obvious, its theme is coherent, it is composed from shared primitives, its primitive bindings correspond to real DSP/control behavior, its controls fit the hand, performance surfaces are usable, knobs retain the integrated-value treatment, no controls overlap, scrolling is deliberate, state is visibly reflected, jacks really patch, output is audible, and save/reload reproduces it correctly.

Before calling the Patch Graph complete, verify it feels like a direct freeform board rather than a conventional boxed node editor, modules preserve their authored hardware faces, pan/zoom is fluid, cables remain correctly attached through transforms, and no primitive can be inserted there.

Passing CI is necessary but does not satisfy this review by itself.
