# MultiSynth Module Interface Layout Contract

This document defines the canonical layout rules for every finished MultiSynth module interface.

The architectural model is invariant:

**Patch Graph -> modules -> shared control library.**

A finished module is an intentionally composed face made from shared library controls. Module code may arrange, bind and theme those controls. It must not invent a second control system or substitute custom lookalike controls for library primitives.

## 1. The reference composition pattern

A module face uses this hierarchy:

```text
module viewport
  main content inset
    header
    output scope / primary display when applicable
    module panel
      functional bank
      functional bank
      functional bank
```

The outer content has breathing room from the viewport. The module panel is centered and bounded. Functional banks live inside that panel and have their own internal padding.

No control, bank, panel, title, screen or grid should appear visually smashed against a viewport edge or another container edge.

## 2. Outer page spacing

Phone-first defaults:

- page/content inset: approximately 8-16 px depending on viewport width;
- vertical separation between header, scope and module panel: approximately 10-16 px;
- module panel centered with a useful maximum width on wider screens;
- bottom padding must account for persistent app controls / safe area;
- nothing important may rely on the physical screen edge as its margin.

The layout should become denser on a narrow phone by reducing gaps and control sizes modestly, not by eliminating padding.

## 3. One main module panel

Prefer one coherent module chassis/panel containing the device's functional regions.

Do not make each control group look like a separate unrelated full-size card unless the physical device concept genuinely calls for separate subassemblies.

The main panel should provide:

- consistent outer padding;
- a clear faceplate/chassis boundary;
- a stable maximum width;
- intentional internal hierarchy;
- room for controls to breathe.

A module may be taller than the viewport and scroll vertically. Horizontal overflow is normally a layout failure unless the interface explicitly requires a horizontal performance surface.

## 4. Functional banks

Controls are grouped by musical job, not by implementation type.

Examples:

- transport;
- tempo/timing;
- oscillator section;
- filter section;
- envelope section;
- sample parameters;
- sample pads;
- sequencer steps;
- mixer channels;
- source/library display;
- modulation;
- output.

A bank uses an internal inset and spacing distinct from the main panel. Related controls stay together. Unrelated controls get visible separation.

A useful default bank treatment is:

- 12-18 px internal padding on normal widths;
- 8-14 px on narrow phones;
- 12-24 px separation between banks depending on hierarchy;
- optional border/recess/material change to make the grouping physically legible.

## 5. Control grids

Control grids must be derived from usable touch size and available width.

Do not choose a column count simply to keep everything on one row.

Rules:

- controls may shrink only within the shared library's useful size range;
- preserve enough gap that adjacent touch targets do not feel merged;
- labels must fit without colliding with neighboring labels;
- values must remain readable;
- when a row no longer fits, reflow to fewer columns;
- do not let CSS grid force a bank wider than its panel.

Typical phone patterns:

- large knobs/dials: 2-3 columns;
- small knobs: 3 columns, occasionally 4 when genuinely compact;
- transport buttons/switches: 2-4 columns depending on width;
- sample/drum pads: commonly 4 columns;
- 16-step controls: commonly 4 or 8 columns depending on control size;
- 32-step controls: commonly 8 columns of compact step controls, with spacing preserved.

These are composition patterns, not mandatory counts. Usability wins over keeping an arbitrary count on one line.

## 6. Primary versus secondary controls

Every module has a primary musical job. The layout must make that job immediately obvious.

Primary controls receive the best space and easiest reach. Secondary configuration controls may be smaller, grouped lower, or placed in a scrollable section.

Examples:

- sampler: pads/sample selection and sequence behavior are primary;
- drum machine: pads, steps and transport are primary;
- synth: performance surface and principal tone controls are primary;
- mixer: channel strips and levels are primary;
- timing module: timing/rate controls and timing indication are primary.

Do not let low-priority configuration consume the top of the face while the module's actual performance surface is buried below it.

## 7. Shared controls only

Interactive hardware comes from the shared control library.

That includes knobs, dials, switches, buttons, pads, faders, ribbons, keys, screens, meters, LEDs, jacks and other registered primitives.

Module code is responsible for:

- selecting the correct library primitive;
- binding it to module state;
- choosing an appropriate approved variant;
- arranging it on the face;
- applying the module theme;
- updating its visual state.

Module code must not:

- redraw a substitute knob/button/switch from arbitrary DOM;
- create a parallel interaction model;
- replace a shared control because local CSS is easier;
- build a generic per-module control framework;
- reintroduce retired UI systems.

Non-interactive structural DOM is expected for panels, banks, headings, labels, rows and layout containers.

## 8. Choosing the control type

Choose hardware according to intended use.

- knob: set-and-leave parameters with a moderate useful range;
- dial: wide range, high sensitivity, high resolution, indexed selection or deliberate precision;
- switch: persistent binary state;
- momentary button: action that exists while pressed or fires once;
- pad: direct performance/selection target where area matters;
- fader: continuous level or position where visible linear relationship matters;
- ribbon/XY: direct continuous gesture control;
- screen: information or selection surface that benefits from a bounded display;
- LED/meter: status/level indication rather than a substitute for text-heavy UI.

Do not use a control merely because it fits a grid conveniently.

## 9. Labels and values

Labels belong to the physical control composition and should remain predictable.

- one concise label per control;
- no duplicate headings that repeat the same meaning immediately above and below a control;
- values use the shared control readout where supported;
- units are concise and consistent;
- labels may wrap only where the control type genuinely needs longer names, such as sample pads/library choices;
- wrapping must not change neighboring control widths unpredictably.

Section headings describe a bank's job, not individual control names.

## 10. Screens and lists

Screens are library controls. Their internal informational/list content may use ordinary structural DOM inside the screen face.

A screen/list should:

- remain inside the module panel width;
- have its own internal inset;
- scroll internally when appropriate;
- avoid forcing the whole module wider;
- keep action controls aligned and touchable;
- preserve the visual identity of a mounted display rather than becoming a generic webpage list.

## 11. Responsive behavior

Phone layout is the baseline, not a compressed desktop afterthought.

Responsive changes should happen in this order:

1. reduce outer/page gaps modestly;
2. reduce bank padding modestly;
3. reduce inter-control gaps modestly;
4. use smaller approved control sizes where appropriate;
5. reflow grids to fewer columns;
6. allow vertical growth/scroll.

Do not solve narrow width by:

- removing all margins;
- touching panel borders to the screen edge;
- overlapping labels;
- clipping controls;
- horizontal scrolling of ordinary parameter banks;
- shrinking touch targets below useful sizes.

## 12. Predictable module skeleton

Unless a module has a strong reason to differ, build its editor in this order:

```text
header
scope / primary display
main module panel
  primary performance bank
  primary parameter bank
  secondary parameter bank(s)
  sequence / matrix / source bank where applicable
```

The order follows musical use, not code initialization order.

## 13. CSS ownership

Shared control geometry and interaction belong to the shared control library.

Module CSS owns:

- page background/material;
- main panel/chassis;
- bank composition;
- grid/flow layout;
- spacing;
- theme colors/material treatment;
- module-specific responsive arrangement.

Module CSS may theme a shared control through supported classes/variables. It should not reconstruct the control's anatomy.

## 14. Reference implementation pattern

No Quarter is the current reference for general face composition:

- page inset;
- centered bounded main panel;
- deliberate internal bank padding;
- useful gaps between controls;
- responsive column reduction;
- preserved margins on narrow phones;
- shared controls placed directly into an intentional physical face.

Copy the composition principles, not the instrument-specific colors or exact grid counts.

## 15. Completion gate

A module interface is not complete until all of the following are true:

- its primary job is obvious at first glance;
- every interactive control is a shared library control;
- controls have useful touch sizes;
- no controls overlap;
- no labels collide;
- no ordinary bank horizontally overflows;
- the face has visible outer margins on phone;
- the main panel has consistent inset;
- banks have consistent internal padding;
- related controls are visibly grouped;
- the interface remains usable at the narrow-phone breakpoint;
- state changes are reflected immediately;
- the module looks intentionally assembled rather than browser-laid-out.

If any of these fail, fix the composition rather than adding another UI layer.
