import fs from "node:fs";
import vm from "node:vm";

const read = p => fs.readFileSync(p, "utf8");
const files = {
  deal: "app/src/main/assets/modules/big-deal.js",
  mouth: "app/src/main/assets/modules/big-mouth.js",
  liquor: "app/src/main/assets/modules/grain-liqour.js",
  manifest: "app/src/main/assets/module-manifest.js",
};

for (const [name, path] of Object.entries(files)) {
  const src = read(path);
  if (!src.trim()) throw new Error(`${name} is empty`);
  if (path.endsWith(".js")) new vm.Script(src, { filename: path });
}

const deal = read(files.deal), mouth = read(files.mouth), liquor = read(files.liquor), manifest = read(files.manifest);
const requireText = (src, text, label) => { if (!src.includes(text)) throw new Error(`${label}: missing ${text}`); };

for (const [src, label] of [[deal,"Big Deal"],[mouth,"Big Mouth"],[liquor,"Grain Liqour"]]) {
  requireText(src, 'family:"granular"', label);
  requireText(src, "midiMessage", label);
}

requireText(deal, "noteOn", "Big Deal playable MIDI");
requireText(deal, "expression", "Big Deal expression");
requireText(deal, "pitchBend", "Big Deal pitch bend");
requireText(deal, "d1===7", "Big Deal CC7");
requireText(deal, "d1===11", "Big Deal CC11");
requireText(deal, "d1===1", "Big Deal CC1");

requireText(mouth, "d1===1", "Big Mouth CC1 depth");
requireText(mouth, "cmd===0xe0", "Big Mouth pitch bend formant shift");
requireText(mouth, "d1===20", "Big Mouth freeze CC");
requireText(mouth, "d1===21", "Big Mouth loop CC");

requireText(liquor, "noteOn", "Grain Liqour note on");
requireText(liquor, "noteOff", "Grain Liqour note off");
requireText(liquor, "d1===7", "Grain Liqour CC7");
requireText(liquor, "d1===11", "Grain Liqour CC11");
requireText(liquor, "d1===64", "Grain Liqour sustain");
requireText(liquor, "cmd===0xe0", "Grain Liqour pitch bend");

requireText(manifest, '[I.BIG_DEAL]:row(I.BIG_DEAL,"granular","#b4232f",["audioInput","audioOutput","noteInput","midiInput","pcm"]', "Big Deal manifest MIDI");
requireText(manifest, '[I.BIG_MOUTH]:row(I.BIG_MOUTH,"effect","#ff4f87",["audioInput","audioOutput","midiInput","pcm","mic"]', "Big Mouth manifest MIDI");
requireText(manifest, '[I.GRAIN_LIQOUR]:row(I.GRAIN_LIQOUR,"granular","#8d5fa8",["audioOutput","generator","noteInput","midiInput","pcm"]', "Grain Liqour manifest MIDI");

console.log("Granular family smoke passed");
