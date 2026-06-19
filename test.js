// Smoke test for the chord math (the only non-trivial logic). Run: node test.js
const assert = require('assert');

const ROOTS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const QUALITIES = { 'maj':[0,4,7], 'min':[0,3,7], '7':[0,4,7,10], 'm7':[0,3,7,10], 'maj9':[0,4,7,11,14] };

// mirrors notesFor() in index.html (Tone uses C4 = midi 60)
function midiChord(rootIdx, octave, qual) {
  const base = 12 * (octave + 1) + rootIdx;
  return QUALITIES[qual].map(i => base + i);
}

assert.deepStrictEqual(midiChord(0, 3, 'maj'), [48, 52, 55]);              // C3 major = C3 E3 G3
assert.deepStrictEqual(midiChord(9, 3, 'm7'), [57, 60, 64, 67]);          // A3 m7 = A3 C4 E4 G4
assert.deepStrictEqual(midiChord(0, 4, 'maj9'), [60, 64, 67, 71, 74]); // C4 maj9 = C4 E4 G4 B4 D5
assert.strictEqual(ROOTS.length, 12);
assert.ok(Object.values(QUALITIES).every(iv => iv[0] === 0)); // every chord starts on its root

console.log('ok');
