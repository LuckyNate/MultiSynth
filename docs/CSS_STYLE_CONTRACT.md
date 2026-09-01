# MultiSynth CSS Style Contract

This is the canonical CSS contract for MultiSynth.

The invariant remains:

**Patch Graph -> modules -> shared control library.**

CSS must reinforce that architecture. A finished module should render into a useful phone interface on the first attempt without inventing local control anatomy or repairing shared layout locally.

## 1. Ownership

### `control-surface.css` owns shared module UI geometry

It owns:

- the full-width module control root;
- standard module shell width and containment;
- standard bank spacing and padding;
- standard responsive control grids;
- standard responsive reflow;
- control containment inside grid cells;
- shared control anatomy;
- shared control dimensions and useful minimum touch sizes;
- screen/list containment;
- common label/value behavior;
- prevention of horizontal overflow.

If an ordinary module needs local CSS merely to fit on a phone, the shared control surface is wrong and must be fixed there.

### `module-instrument-editor.css` owns only editor/page framing

It may own:

- page/body defaults;
- header typography;
- scope framing;
- generic page maximum width;
- safe-area/bottom clearance.

It must **never** assign columns, auto-fit behavior, grid structure, widths or responsive layout to `#controls`.

`#controls` is a neutral full-width mount point.

### Module CSS owns identity, not infrastructure

A module stylesheet may own:

- four-color theme and derived colors;
- background/chassis material;
- bank material/borders/shadows;
- typography and decorative artwork;
- color treatment of shared controls;
- genuinely module-specific noninteractive content inside a screen;
- a deliberate composition override when the standard semantic layout cannot represent the instrument.

A module stylesheet must not own:

- substitute knobs, dials, switches, pads, faders, ribbons, keys, jacks or screens;
- shared control anatomy;
- a second control interaction system;
- the global `#controls` layout;
- generic phone reflow that belongs to the shared surface;
- fixed grid minima that can widen a bank;
- arbitrary control widths used to make a grid fit.

## 2. Canonical shared layout roles

Finished modules should compose these shared classes rather than creating a new layout vocabulary for ordinary banks:

```text
.ms-module-surface
  .ms-module-shell
    .ms-module-bank
      .ms-module-bank-title
      .ms-layout
```

Use the semantic layout role that matches the bank:

- `.ms-layout--transport`
- `.ms-layout--knobs`
- `.ms-layout--params`
- `.ms-layout--pads`
- `.ms-layout--steps`
- `.ms-layout--list`

The shared stylesheet decides the actual phone column count and breakpoint behavior.

Module code describes **what the bank is**. Shared CSS decides **how that ordinary bank fits**.

## 3. The root rule

Every module editor must satisfy:

```css
#controls {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
```

The root may never become a two-column/auto-fit grid around complete module faces.

A complete module shell is one child occupying the available control-root width.

## 4. Box sizing and containment

Shared layout containers and controls use border-box geometry.

Required principles:

- `box-sizing:border-box`;
- grid/flex children that shrink use `min-width:0`;
- shells/banks/screens use `max-width:100%`;
- ordinary module faces never create horizontal page scrolling;
- controls do not paint across bank borders;
- text does not determine track width unexpectedly.

Horizontal overflow in a finished module is a bug.

## 5. Grid rule

Ordinary module grids use shared semantic roles and `minmax(0,1fr)` tracks.

Do not use fixed numeric minima such as:

```css
grid-template-columns: repeat(4, minmax(92px, 1fr));
```

inside finished module CSS. That pushes width decisions back into every module and can make the parent wider than the viewport.

The shared surface owns the tested control-size/breakpoint relationship once.

## 6. Responsive rule

Phone is baseline.

The shared surface handles ordinary bank reflow in this order:

1. preserve page inset;
2. preserve bank inset;
3. preserve usable touch targets;
4. reduce nonessential gaps modestly;
5. reduce columns;
6. grow vertically.

Do not repair a module by repeatedly shrinking controls.

## 7. Shared control styling

Module CSS may recolor/material-style shared controls through supported variables and descendant selectors, for example:

```css
.my-module .ms-control {
  --ms-control-fg: var(--text);
  --ms-control-accent: var(--accent);
}
```

It may style borders/background/shadow of a shared face for the module's material identity.

It must not recreate the hardware with new local elements/pseudo-elements or define a private knob/pad/switch class.

Geometry changes to shared primitives belong in `control-surface-spec.js` / `control-surface.css` unless the primitive is explicitly authored as a special approved variant.

## 8. Screens and module-specific content

The screen itself is a shared library control.

Ordinary DOM may be placed inside the screen face for content such as:

- sample/library rows;
- names/status text;
- waveform content;
- selection lists.

The content may have module-specific CSS, but the screen boundary, containment and standard list geometry remain shared.

Long text must remain a usable-width row and may not collapse into a narrow word tower.

## 9. Special performance surfaces

A genuinely special performance surface may have dedicated shared CSS when it is itself a reusable control family, for example the performance keyboard.

The correct progression is:

**special behavior needed by multiple modules -> shared control primitive/style**

not:

**special behavior -> duplicate custom control in each module**.

## 10. Non-module application CSS

Patch Graph, menus, navigation, selector UI and Module Builder are application surfaces rather than finished module faces. They have their own layout responsibilities.

They must still follow containment, safe-area and no-accidental-horizontal-overflow rules, but they are not required to use `.ms-module-shell` / `.ms-module-bank`.

## 11. Forbidden patterns in finished-module CSS

The following are architecture violations unless the file is an explicitly shared control implementation:

- private knob/dial/switch/pad/fader/ribbon anatomy;
- retired control class names;
- `#controls` grid/columns/layout overrides;
- generic `.controls` systems duplicating the shared module surface;
- hard-coded `grid-template-columns` used solely to make standard controls fit;
- fixed numeric `minmax()` track minima for ordinary control banks;
- local touch/interaction styling for controls that exist in the library;
- module-specific repair styles that compensate for a shared CSS defect.

## 12. First-try module pattern

A normal module should require only:

1. editor framing stylesheet;
2. `control-surface.css`;
3. module theme stylesheet;
4. structural DOM with shared shell/bank/layout roles;
5. controls mounted by `ControlSurfaceRenderer`.

The module theme stylesheet should be mostly colors, materials, typography and genuinely unique decoration.

If ordinary knobs/pads/steps/transport require new responsive CSS, stop and improve the shared surface instead.

## 13. Compliance gate

A finished module style is compliant only when:

- `#controls` remains full-width and layout-neutral outside the shared surface;
- the module shell fills the available width up to its maximum;
- ordinary banks use shared semantic layout roles;
- every interactive control comes from the shared library;
- no private control anatomy exists;
- no ordinary bank horizontally overflows;
- no fixed grid minimum can widen the bank;
- labels remain contained;
- phone reflow is provided by the shared surface;
- module CSS is primarily identity/presentation, not repair/infrastructure.

When this contract and implementation disagree, fix the shared implementation or migrate the module. Do not add another compatibility layer.
