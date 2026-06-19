// Smoke test for the chord math (the only non-trivial logic). Run: npm test
import assert from 'node:assert';
import { ROOTS, QUALITIES, chordMidi } from './src/chords.js';

assert.deepStrictEqual(chordMidi(0, 3, 'maj'), [48, 52, 55]);          // C3 major = C3 E3 G3
assert.deepStrictEqual(chordMidi(9, 3, 'm7'), [57, 60, 64, 67]);       // A3 m7 = A3 C4 E4 G4
assert.deepStrictEqual(chordMidi(0, 4, 'maj9'), [60, 64, 67, 71, 74]); // C4 maj9 = C4 E4 G4 B4 D5
assert.strictEqual(ROOTS.length, 12);
assert.ok(Object.values(QUALITIES).every(iv => iv[0] === 0)); // every chord starts on its root

console.log('ok');
