import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const namer = read('app/src/main/assets/sample-namer.js');
const surgeryHtml = read('app/src/main/assets/sample-surgery.html');
const libraryHtml = read('app/src/main/assets/sample-library.html');
const surgeryUi = read('app/src/main/assets/sample-surgery.js');
const libraryUi = read('app/src/main/assets/sample-library-browser.js');
const surgeryModule = read('app/src/main/assets/modules/sample-surgery.js');
const libraryModule = read('app/src/main/assets/modules/sample-library.js');

const requireText = (text, needle, label) => {
  if (!text.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
};
const forbidText = (text, needle, label) => {
  if (text.includes(needle)) throw new Error(`Forbidden ${label}: ${needle}`);
};

requireText(namer, 'SampleNamer=Object.freeze({open})', 'shared sample namer API');
requireText(surgeryHtml, 'sample-namer.js', 'Sample Surgery namer include');
requireText(libraryHtml, 'sample-namer.js', 'Sample Library namer include');
requireText(surgeryUi, 'NAME OPERATED SAMPLE', 'Sample Surgery named save-as');
requireText(surgeryUi, 'confirmLabel:"SAVE SAMPLE"', 'Sample Surgery save confirmation');
requireText(libraryUi, 'title:"NAME SAMPLE"', 'Sample Library naming flow');
requireText(libraryUi, 'confirmLabel:"RENAME"', 'Sample Library rename confirmation');
forbidText(libraryUi, 'prompt("Rename sample"', 'raw Sample Library rename prompt');

for (let cc = 16; cc <= 30; cc++) {
  if (![16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].includes(cc)) continue;
  requireText(surgeryModule, `d1===${cc}`, `Sample Surgery CC${cc}`);
}
requireText(surgeryModule, 'sample-surgery-midi-action', 'Sample Surgery MIDI event');
requireText(surgeryUi, 'sample-surgery-midi-action', 'Sample Surgery MIDI UI receiver');
requireText(libraryModule, 'command===0xc0', 'Sample Library Program Change selection');
requireText(libraryModule, 'd1===16', 'Sample Library previous mapping');
requireText(libraryModule, 'd1===17', 'Sample Library next mapping');
requireText(libraryModule, 'command===0x90&&d2>0', 'Sample Library audition note');
requireText(libraryUi, 'sample-library-midi-action', 'Sample Library MIDI UI receiver');

console.log('Sample utilities smoke passed');
