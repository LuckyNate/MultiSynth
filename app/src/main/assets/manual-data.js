"use strict";
(function(global){
  const MS=global.MultiSynth=global.MultiSynth||{};
  MS.Manual=Object.freeze({
    version:1,
    title:"MultiSynth Manual",
    sections:Object.freeze([
      Object.freeze({id:"start",title:"Start Here",body:"MultiSynth is built around modules, racks, and the node graph. Test a module by itself, combine modules inside a rack, then connect racks on the node graph."}),
      Object.freeze({id:"signal-flow",title:"Signal Flow",body:"Audio moves downward through a rack. A rack input feeds the first audio-capable module, each module feeds the next compatible module, and the final signal reaches the rack output. Rack-to-rack connections feed the receiving rack from its top-level input."}),
      Object.freeze({id:"carrier",title:"Synth Carrier Input",body:"When a carrier synth receives rack audio, that incoming signal becomes the synth carrier. The synth processes the incoming carrier instead of replacing it with a separate oscillator. PureSynth, QuadSynth, Pulsynth, SinLadder, Razorback, Stinger, and No Quarter use this shared carrier-input rule. RanDrone and Unstable Diffusion also accept rack audio, using their own processor paths."}),
      Object.freeze({id:"rack-output",title:"Rack Output",body:"The OUT side of a rack is the rack's final post-module output. Connect that output to another rack to continue the cascade, or leave the rack as a leaf and it feeds the final mix."}),
      Object.freeze({id:"build-racks",title:"Building Racks",body:"Add modules in the order you want the signal to travel. The top module receives the rack input when it can accept audio. Modules farther down receive the result from the compatible module above them."}),
      Object.freeze({id:"node-graph",title:"Node Graph",body:"Use the node graph to connect complete racks. Parent rack outputs feed child rack inputs. A signal can split to multiple child racks and leaf racks are mixed into the final output pool."}),
      Object.freeze({id:"performance",title:"Playing",body:"The shared performance keyboard sends notes to note-capable modules. A synth with no upstream carrier can generate its own sound. A carrier synth with upstream audio uses the rack signal as its carrier while note and CV controls shape or modulate that signal."}),
      Object.freeze({id:"saving",title:"Saving",body:"Rack layout, module state, names, and other persistent work should survive navigation and app restarts. Use named racks when you want a human-readable identity; unnamed racks may use their internal rack ID."})
    ])
  });
})(window);