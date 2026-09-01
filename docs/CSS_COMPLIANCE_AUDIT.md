# MultiSynth CSS Compliance Audit

Audit target: `main` after the shared control-surface layout contract was established.

This is a stylesheet-by-stylesheet static review against `docs/CSS_STYLE_CONTRACT.md`.

Status meanings:

- **PASS** — consistent with its assigned ownership.
- **PASS / SPECIALIZED** — shared/application surface with a deliberate job outside ordinary finished-module layout.
- **PARTIAL** — uses the shared control system but still owns layout/geometry that should move into the shared surface.
- **MIGRATE** — finished-module stylesheet still implements local controls, raw form controls, local responsive infrastructure, or another pattern forbidden by the contract.
- **RETIRE** — transitional/retired style layer that should no longer be necessary once migration is complete.

## Shared/core styles

| Stylesheet | Status | Review |
| --- | --- | --- |
| `app/src/main/assets/control-surface.css` | **PASS** | Canonical owner of shared control anatomy and standard module shell/bank/layout roles. Retired control definitions were removed. |
| `app/src/main/assets/module-instrument-editor.css` | **PASS** | Editor/page framing is layout-neutral at `#controls`; no module-face column system remains. |
| `app/src/main/assets/control-performance-keyboard.css` | **PASS / SPECIALIZED** | Dedicated shared performance-control family; correct place for reusable keyboard geometry. |
| `app/src/main/assets/control-ribbon.css` | **PASS / SPECIALIZED** | Dedicated shared ribbon-control styling; belongs at shared-control level. |
| `app/src/main/assets/node-jacks.css` | **PASS / SPECIALIZED** | Patch-graph jack presentation, not ordinary module-bank layout. |
| `app/src/main/assets/node-port-contract.css` | **PASS / SPECIALIZED** | Patch-graph port contract styling, outside ordinary module-face composition. |
| `app/src/main/assets/node-plane.css` | **PASS / SPECIALIZED** | Patch Graph application surface. Different layout owner by design. |
| `app/src/main/assets/module-selector-ui.css` | **PASS / SPECIALIZED** | Application selector UI, not a finished module face. |
| `app/src/main/assets/main-menu.css` | **PASS / SPECIALIZED** | Application navigation surface. |
| `app/src/main/assets/mode-navigation.css` | **PASS / SPECIALIZED** | Application navigation surface. |
| `tools/module-builder/module-builder.css` | **PASS / SPECIALIZED** | Authoring tool surface, not a finished module face. |
| `app/src/main/assets/console-fit.css` | **RETIRE** | Transitional global repair stylesheet. Its containment rules should live in the actual shared owners rather than compensating for arbitrary module CSS. Do not add new dependencies on it. |
| `app/src/main/assets/device-controls.css` | **RETIRE / MIGRATE** | Older generic device-control style layer overlaps the shared control-surface responsibility. Existing users should move to registered library controls. |
| `app/src/main/assets/rack-palettes.css` | **RETIRE** | Legacy palette/style artifact from the removed architecture. Theme colors that remain useful should move to current module themes/shared variables, then this file should disappear. |

## Finished-module styles

| Stylesheet | Status | Review |
| --- | --- | --- |
| `app/src/main/assets/ws-editor.css` | **PASS** | Whitman theme/material treatment primarily colors shared controls and the chassis. No private interactive control implementation. |
| `app/src/main/assets/ws-layout.css` | **PARTIAL** | Mostly unique Whitman screen/list content, but still overrides shared pad/step/delete geometry. Those ordinary control sizes should move into shared semantic roles/variants so this file becomes presentation/content-only. |
| `app/src/main/assets/no-quarter.css` | **PARTIAL** | Uses shared controls, but owns fixed local control grids (`minmax(92px...)`, `minmax(88px...)`) and responsive column decisions. Migrate the ordinary banks to shared semantic layout roles; retain blue/silver material identity and unique crackle composition only. |
| `app/src/main/assets/time-bandits-builder.css` | **PARTIAL** | Uses shared controls, but duplicates standard knob/button/screen/list layout and fixed grid minima locally. Keep Time Bandits-specific ribbon/clock presentation; move ordinary bank geometry to shared roles. |
| `app/src/main/assets/time-bandits.css` | **RETIRE / MIGRATE** | Older Time Bandits style path remains alongside the builder/shared-control path. Consolidate onto the current shared-control implementation and remove obsolete duplicate rules. |
| `app/src/main/assets/big-deal.css` | **MIGRATE** | Contains retired/private control selectors (`.knobControl`, `.rackKnobFace`, `.rackKnobTick`, `.rackKnobValue`) plus raw buttons/inputs and local control minima. Theme/decorative card identity is salvageable; control/layout implementation is not compliant. |
| `app/src/main/assets/big-mouth.css` | **MIGRATE** | Defines private `.bmKnob` anatomy and raw switches/buttons. Mouth artwork is valid decoration; interactive hardware must be library controls. |
| `app/src/main/assets/control-freak.css` | **MIGRATE** | Defines private knobs, faders, ribbon, keys, pads and transport hardware. This duplicates several existing shared control families and must be rebuilt from library controls. |
| `app/src/main/assets/denzels-equalizer.css` | **MIGRATE** | Defines private vertical ribbon anatomy and references older `.knobControl`; 10-band composition is valid, but controls must use the shared library/ribbon primitive. |
| `app/src/main/assets/echo-canyon.css` | **MIGRATE** | Theme/artwork is valid, but styling references older `.deviceKnobFace` control anatomy. Migrate controls to shared primitives while retaining canyon presentation. |
| `app/src/main/assets/been-served.css` | **MIGRATE** | Uses raw labeled inputs as the module control system. Envelope/paper identity can remain; controls must be shared library primitives and standard banks. |
| `app/src/main/assets/garage-band.css` | **MIGRATE** | Uses raw labeled inputs and a private `.controls` grid. Preserve the visual identity only; rebuild interactive surface from library controls/shared layout. |
| `app/src/main/assets/live-wire.css` | **MIGRATE** | Contains private seek dial, toggles/transport and bespoke interactive geometry. CRT/video presentation is valid unique content; ordinary controls should come from the library. |
| `app/src/main/assets/lowrider-lfo.css` | **MIGRATE** | Contains private chain dial and `.lrKnob` interactive controls. Decorative chain-wheel concept may become an approved shared dial variant if required; current local control implementation is noncompliant. |
| `app/src/main/assets/master-of-levels.css` | **MIGRATE** | Uses raw labeled inputs and private `.controls` layout. Visual identity may remain; interactive controls must migrate. |
| `app/src/main/assets/randrone.css` | **MIGRATE** | Defines private `.rdKnob` anatomy/readout. Rebuild from shared knobs and shared bank/grid roles. |
| `app/src/main/assets/sample-library.css` | **MIGRATE** | Finished Sample Library module still uses raw buttons/form-style application controls and local responsive grids. Library content layout is valid, but actions/controls should be registered shared controls/screens. |
| `app/src/main/assets/sample-surgery.css` | **MIGRATE** | Explicitly lays out `#controls` as its own grid and uses raw sliders/toggles/buttons. This directly violates shared-root and shared-control ownership. |
| `app/src/main/assets/tail-gator.css` | **MIGRATE** | Uses raw toggle/range/buttons as module hardware. Tailgate artwork/composition can remain; controls must migrate to the library. |
| `app/src/main/assets/the-chopper.css` | **MIGRATE** | Uses raw ranges/buttons and private performance pads/rows. Chainsaw artwork/screen content is valid; interactive surface must use shared controls/layout roles. |

## Summary

Current result:

- canonical shared control/layout owners are now structurally correct;
- Whitman is the closest current module to the target architecture;
- No Quarter and Time Bandits already use shared controls but still carry too much local layout geometry;
- the older catalog largely predates the invariant and needs control-surface migration, not incremental CSS repair;
- transitional `console-fit.css`, `device-controls.css`, `rack-palettes.css`, and duplicate Time Bandits styling should not receive new work.

## Compliance order

When cleaning the remaining catalog, use this order per module:

1. remove private/raw interactive controls;
2. mount the equivalent registered library controls;
3. wrap ordinary groups in shared shell/bank/semantic layout roles;
4. delete local responsive/grid rules now supplied by `control-surface.css`;
5. preserve only theme/material/decorative/module-specific screen content;
6. verify narrow-phone containment and interaction;
7. remove obsolete shared/transitional CSS once its final consumer is migrated.

Do not attempt to make a noncompliant module pass by adding another global repair stylesheet.
