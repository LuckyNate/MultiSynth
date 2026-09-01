# MultiSynth Module Interface Layout Contract

This document defines the canonical layout rules for every finished MultiSynth module interface.

The architectural model is invariant:

**Patch Graph -> modules -> shared control library.**

The shared control surface owns the default geometry. A module declares semantic layout roles and supplies theme/content. It does not reinvent page, bank, grid or responsive CSS.

## 1. Required shared structure

A normal module editor uses this hierarchy:

```text
#controls
  .ms-module-surface
    .ms-module-bank
      .ms-module-bank-title
      .ms-control-grid + one semantic layout role
```

Semantic grid roles supplied by the shared control surface are:

- `.ms-layout-transport`
- `.ms-layout-knobs`
- `.ms-layout-params`
- `.ms-layout-pads`
- `.ms-layout-steps`
- `.ms-layout-list`
- `.ms-layout-fill` when controls should fill their grid cell

List rows use `.ms-list-row`.

These classes are the default module composition API. New modules should use them before writing any module-specific geometry.

## 2. Shared CSS owns layout

`control-surface.css` owns:

- full-width module surface behavior;
- maximum module width;
- page inset;
- bank inset and separation;
- grid behavior;
- responsive column counts;
- responsive knob/dial sizing;
- fill behavior for pads/buttons/steps/lists;
- screen width containment;
- label overflow containment;
- list-row geometry;
- narrow-phone reflow;
- horizontal-overflow prevention.

`module-instrument-editor.css` is layout-neutral. It provides the page/header/scope frame only. It must never assign a multi-column layout to `#controls`.

## 3. Module CSS does not reimplement geometry

Module CSS normally owns only:

- colors/theme;
- faceplate material;
- bank material/border treatment;
- typography flavor;
- deliberate device-specific decorative treatment;
- exceptional composition that the shared semantic roles genuinely cannot express.

A module stylesheet should not normally set:

- `#controls` display or columns;
- shell width;
- shell page margins;
- bank width;
- standard bank padding;
- standard bank spacing;
- ordinary control-grid column counts;
- ordinary phone breakpoints;
- generic knob/dial responsive sizes;
- generic pad/step/list containment.

If a new module needs those declarations just to become usable on a phone, the shared control surface is missing a reusable rule and should be fixed there instead.

## 4. Phone viewport is the hard constraint

At every supported phone width, the entire module face must fit the viewport width.

**Horizontal overflow is a failed layout.**

This applies to the module surface, every bank, every grid, every screen and every control.

The shared control surface is responsible for enforcing this by default. Module code should not have to perform one-off width repairs.

## 5. Predictable shared reflow

At phone widths the shared roles intentionally reflow as follows:

- transport: 2 columns;
- ordinary knob bank: 3 columns;
- parameter bank: 3 columns;
- pad bank: 2 columns;
- step bank: 4 columns;
- list: 1 column.

At very narrow widths, knob and parameter banks reflow to 2 columns.

At wider widths the shared grids expand automatically from their role-specific useful minimum widths.

The principle is always the same: reflow vertically before shrinking controls below useful touch size.

## 6. Width arithmetic is centralized

The shared grid system uses shrink-safe tracks and `min-width:0` containment. Modules must not introduce fixed grid minimums that can force a bank wider than its parent.

Forbidden pattern in module CSS:

```css
grid-template-columns:repeat(4,minmax(92px,1fr));
```

when that minimum can exceed the available phone width.

The shared control surface must solve the common case once.

## 7. Controls remain library controls

Interactive hardware comes only from the shared control library: knobs, dials, switches, buttons, pads, faders, ribbons, keys, screens, meters, LEDs, jacks and registered primitives.

Structural DOM is allowed for module surfaces, banks, headings, grids and list content.

There is no second interactive-control layer and no retired control implementation inside `control-surface.css`.

## 8. Choosing the semantic role

Choose the shared role from the musical job of the bank:

- transport actions/state -> `.ms-layout-transport`
- set-and-leave control bank -> `.ms-layout-knobs`
- selected-item/detail parameters -> `.ms-layout-params`
- performance/selection pads -> `.ms-layout-pads`
- sequencer/step matrix -> `.ms-layout-steps`
- text-heavy choices/library -> `.ms-layout-list`

This should be enough for a first usable layout without new CSS.

## 9. Choosing the control type

- knob: set-and-leave parameter with moderate useful range;
- dial: wide range/high sensitivity/high resolution/indexed precision;
- switch: persistent binary state;
- momentary button: press action;
- pad: direct performance/selection target;
- fader: continuous level/position with useful linear relationship;
- ribbon/XY: gesture control;
- screen: bounded information/selection surface;
- LED/meter: status or level indication.

Control choice follows intended use, not grid convenience.

## 10. Labels and long text

The shared grid constrains labels to their cells. Module content still has to be sensible:

- hardware labels should be concise;
- full sample/file names belong in a list or selected-item display;
- pads should present compact slot identity;
- long text may wrap inside its own cell but may never establish grid width;
- list actions use `.ms-list-row` so text and trailing action controls remain separate.

## 11. Screens and lists

A library `screen` mounted directly inside `.ms-module-bank` automatically fills the usable bank width.

Scrollable content may be placed inside the screen face. Ordinary list rows use `.ms-list-row`.

Module-specific CSS may style the screen material/content, but should not repair its width.

## 12. Escape hatch rule

A module may deliberately override the shared composition only when its physical design genuinely requires a different arrangement: mixer channel strips, a keyboard surface, a large XY surface, a turntable, or another purpose-built performance face.

An override is not permitted merely because the shared default looks inconvenient. If several modules need the same exception, promote it into a new shared semantic layout role.

## 13. Completion gate

A module interface is not complete until:

- `#controls` occupies the full available editor width;
- `.ms-module-surface` remains inside the viewport inset;
- every bank remains inside the surface;
- every control remains inside its grid cell;
- there is no horizontal page overflow;
- no labels collide;
- touch targets remain useful;
- screens/lists remain readable;
- vertical scrolling is deliberate;
- the persistent app footer does not cover the final usable control;
- module-specific CSS contains no unnecessary generic layout repair.

If a standard module fails this gate, fix the shared control surface rather than patching the individual module.
