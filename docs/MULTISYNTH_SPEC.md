# MultiSynth Running Specification

This is the canonical running product specification for current MultiSynth behavior. It describes intended behavior, not merely what happens to exist in a particular build.

## Architecture

MultiSynth is an Android-hosted HTML5 modular audio workstation built around an explicit node graph.

Current workspaces:

- Test Modules — instantiate and verify registered modules.
- Build Racks — assemble reusable ordered module chains.
- Node Graph — place loose modules and saved racks on a freeform plane and connect explicit node ports.

External routing is explicit. Visual position has no routing meaning. Racks are reusable compound nodes with ordered internal top-to-bottom module chains.

## Timing and control model

### Father Time

Father Time is the top-level timer/CV authority. Everything reachable downstream bows to its timer and CV, including modules contained inside downstream rack nodes.

### CV

CV is the persistent parent timing/control signal. It continues downstream unchanged unless a module is explicitly designed to transform it.

### DV

DV means Division Voltage.

DV is a temporary child CV derived for split timing, divided timing, or multiple timing. It does not modify the parent CV and does not persist as an independent graph-wide signal. DV exists to provide local alternate timing while preserving downstream CV.

## Module jobs

### Live Wire

YouTube sampler.

### Beat Red

Drum machine.

### Father Time

Top-level timer and CV authority for all reachable downstream graph content.

### Whitman Sampler

Sampler/sequencer. Captures samples from microphone input or incoming synth/audio, can access the shared sample library, and sequences samples for playback.

### Time Bandits

Probability drum-randomizer voice. Plays its tuned synthesized drum sound, preserves/passes CV behavior, and can source local DV timing. It follows upstream timing when available and falls back to its internal clock when no upstream timer exists. Multiple Time Bandits may be stacked in a rack to form a multi-voice probability drum machine.

### The Chopper

Sample recorder/editor. Records incoming material, automatically detects sounds, chops the recording around detected sounds, and lets the user keep selected chops. Kept chops are saved to the sample library.

### Sample Surgery

Sample editor and library-management tool. Modifies samples and can save/delete samples from the sample libraries.

### Sample Library

File/library management utility for handling, organizing, and sorting the saved sample library.

### Big Deal

Granular sample manipulation processor. Takes already-granulated sample material and treats grains metaphorically as cards in a deck for rearrangement/manipulation into new sample material.

### Big Mouth

Reverse-vocoder/formant module. Records speech, derives speech/formant information, and uses it to shape incoming synth audio. Current known implementation status is broken/incomplete until recording and reverse-vocoder behavior are verified.

### Grain Liqour

Grain synthesis engine. Uses saved grains as click/source material for click synthesis, turning grains into playable synthesized sound.

### Been Served

ADSR envelope.

### Garage Band

Band-pass filter module.

### Master of Levels

Central level-control module for signal levels.

### Denzel's Equalizer

Equalizer.

### Echo Canyon

Echo/environment simulator with closed/open space behavior, wet/dry mix, reflections, and distance controls.

### Control Freak

Fully featured configurable controller: keyboard plus knobs, dials, and shared controls. Its control surface can be configured via node input.

### LOWRIDER LFO

Low-frequency oscillator/control source.

### Unstable Diffusion

Waveform-resolution/resynthesis module. It uses incoming upstream audio as its primary source and resolves a waveform from that source. If no upstream audio is present, it uses an internal white-noise voice as fallback source/carrier.

### PureSynth

Mathematically pure waveform and noise generator for fundamental shapes and noise source material.

### QuadSynth

Additive synthesizer. Stable; do not alter unless fixing an observed malfunction.

### Pulsynth

PWM synthesis ladder.

### SinLadder

Sine synthesis ladder.

### Razorback

Triangle/sawtooth synthesis ladder with tunable waveform peak position.

### Stinger

Click synthesis ladder with tunable accelerating ramps that create underlying harmonic structure.

### No Quarter

Rhodes-style electric piano pushed beyond a conventional Rhodes. Stable; do not alter unless fixing an observed malfunction.

### RanDrone

Random-sound drone generator. Can drone continuously, or CV/DV can trigger one discrete randomized sound event per incoming click.

### Hookworm

Granular echo looper.

### Tapeworm

Tape-loop recorder/echo.

### Tail Gator

Bluetooth/car-audio routing module. Prevents Bluetooth/car audio from hijacking MultiSynth output, or deliberately enables car Bluetooth output for Tailgate Mode.

## Module construction rules

- Build module UIs exclusively from the Module Builder library.
- One canonical module identity and runtime definition per active module.
- Module Builder definitions are authoritative with the module implementation, not duplicated in parallel registries.
- Immediate hardware-like interaction is preferred; avoid browser-native dialogs/menus where an in-module surface can do the job.
- Stable modules must not be modified during unrelated cleanup.

## Persistence

Current node-graph project serialization:

- format: `multisynth-node-graph`
- version: `4`
- routing: `explicit-nodes`

Persist graph nodes, explicit connections, rack contents, module state, referenced assets, and relevant control/resource assignments.

## Documentation policy

This specification is updated whenever intended architecture or module behavior changes. Superseded architecture is removed rather than left as competing current documentation.
