// Smoke test for the chord math (the only non-trivial logic). Run: npm test
import assert from 'node:assert';
import { ROOTS, QUALITIES, chordMidi, triadMidi, triadLabel } from './src/chords.js';
import { polar } from './src/tile.js';

// shared wheel geometry: 0° is 12 o'clock, clockwise (used by every tile)
assert.deepStrictEqual(polar(50, 0).map(Math.round), [50, 0]);    // top
assert.deepStrictEqual(polar(50, 90).map(Math.round), [100, 50]); // right

assert.deepStrictEqual(chordMidi(0, 3, 'maj'), [48, 52, 55]);          // C3 major = C3 E3 G3
assert.deepStrictEqual(chordMidi(9, 3, 'm7'), [57, 60, 64, 67]);       // A3 m7 = A3 C4 E4 G4
assert.deepStrictEqual(chordMidi(0, 4, 'maj9'), [60, 64, 67, 71, 74]); // C4 maj9 = C4 E4 G4 B4 D5
assert.strictEqual(ROOTS.length, 12);
assert.ok(Object.values(QUALITIES).every(iv => iv[0] === 0)); // every chord starts on its root

// direct-play pads: one tap = a finished maj/min chord, modifier baked in
assert.deepStrictEqual(triadMidi(0, 3, false, '—'), [48, 52, 55]);       // C major
assert.deepStrictEqual(triadMidi(0, 3, true, '—'), [48, 51, 55]);        // C minor (b3)
assert.deepStrictEqual(triadMidi(0, 3, true, '7'), [48, 51, 55, 58]);    // Cm7
assert.strictEqual(triadLabel(9, true, '7'), 'Am7');
assert.strictEqual(triadLabel(0, true, 'sus4'), 'Csus4');                // sus drops the minor 'm'
assert.deepStrictEqual(triadMidi(0, 3, false, 'maj9'), [48, 52, 55, 59, 62]); // Cmaj9
assert.deepStrictEqual(triadMidi(0, 3, false, 'dim'), [48, 51, 54]);     // Cdim rebuilds the triad
assert.strictEqual(triadLabel(0, true, 'dim'), 'Cdim');                  // override drops the 'm'
assert.strictEqual(triadLabel(2, false, '6/9'), 'D6/9');
assert.deepStrictEqual(triadMidi(0, 3, false, '7b5'), [48, 52, 54, 58]);  // C7b5: b5 replaces the fifth
assert.deepStrictEqual(triadMidi(0, 3, false, '7#9'), [48, 52, 55, 58, 63]); // C7#9 ("Hendrix")
assert.strictEqual(triadLabel(0, false, '9sus4'), 'C9sus4');             // sus → override drops nothing extra

console.log('ok');
