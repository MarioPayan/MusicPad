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
