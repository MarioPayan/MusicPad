export const ROOTS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// chord quality -> semitone intervals from the root
export const QUALITIES = {
  'maj':[0,4,7], 'min':[0,3,7], '5':[0,7], 'sus2':[0,2,7], 'sus4':[0,5,7],
  'dim':[0,3,6], 'aug':[0,4,8], '6':[0,4,7,9], 'm6':[0,3,7,9],
  '7':[0,4,7,10], 'maj7':[0,4,7,11], 'm7':[0,3,7,10], 'm7b5':[0,3,6,10], 'dim7':[0,3,6,9],
  'add9':[0,4,7,14], '9':[0,4,7,10,14], 'maj9':[0,4,7,11,14], 'm9':[0,3,7,10,14],
};

// MIDI note numbers for a chord (Tone uses C4 = 60).
export function chordMidi(rootIdx, octave, qual) {
  const base = 12 * (octave + 1) + rootIdx;
  return QUALITIES[qual].map(i => base + i);
}

export function chordLabel(rootIdx, qual) {
  return ROOTS[rootIdx] + (qual === 'maj' ? '' : qual);
}

// --- Direct-play model: each pad is a full chord (maj or min triad), and a
// sticky MODIFIER, chosen ahead of time, bakes an extension into every pad.
// One tap = one finished chord; no "play major then alter to minor" step.
// `iv` is the base triad [0, third, 7]. A mod extends it or, for the ones in
// OVERRIDE below, rebuilds it (sus/dim drop the third entirely).
export const MODS = {
  '—':     iv => iv,                 // plain triad
  '7':     iv => [...iv, 10],
  'maj7':  iv => [...iv, 11],
  '6':     iv => [...iv, 9],
  '6/9':   iv => [...iv, 9, 14],
  'add9':  iv => [...iv, 14],
  '9':     iv => [...iv, 10, 14],
  'maj9':  iv => [...iv, 11, 14],
  'add11': iv => [...iv, 17],
  '11':    iv => [...iv, 10, 14, 17],
  '13':    iv => [...iv, 10, 14, 21],
  'sus2':  () => [0, 2, 7],
  'sus4':  () => [0, 5, 7],
  '7sus4': () => [0, 5, 7, 10],
  '9sus4': () => [0, 5, 7, 10, 14],
  'aug':   iv => [iv[0], iv[1], 8],         // raise the fifth, keep maj/min third
  'dim':   () => [0, 3, 6],                 // full diminished triad
  'dim7':  () => [0, 3, 6, 9],
  'm7b5':  () => [0, 3, 6, 10],             // half-diminished
  '7b5':   iv => [iv[0], iv[1], 6, 10],     // altered-dominant family (fifth/ninth tweaks)
  '7#5':   iv => [iv[0], iv[1], 8, 10],
  '7b9':   iv => [...iv, 10, 13],
  '7#9':   iv => [...iv, 10, 15],
};

// mods that rebuild the triad → the explicit minor 'm' makes no sense in the label
const OVERRIDE = new Set(['sus2', 'sus4', '7sus4', '9sus4', 'dim', 'dim7', 'm7b5']);

export function triadMidi(rootIdx, octave, isMinor, mod) {
  const iv = MODS[mod]([0, isMinor ? 3 : 4, 7]);
  const base = 12 * (octave + 1) + rootIdx;
  return iv.map(i => base + i);
}

export function triadLabel(rootIdx, isMinor, mod) {
  const m = isMinor && !OVERRIDE.has(mod) ? 'm' : '';
  return ROOTS[rootIdx] + m + (mod === '—' ? '' : mod);
}
