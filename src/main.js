import './style.css';
import * as Tone from 'tone';
import { ROOTS, MODS, triadMidi, triadLabel } from './chords.js';
import { makeTile } from './tile.js';

// Cut Tone's default 100ms scheduling buffer — we trigger live on touch, not on
// a transport, so we want the chord the instant the finger lands.
// ponytail: 0.01s, not 0 — a hair of buffer avoids clicks/dropouts on mobile.
Tone.getContext().lookAhead = 0.01;

// Warm synth pad — fat saw through a lowpass + a touch of reverb so it sits
// under singing without the percussive piano transient. No network needed.
let started = false;
const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.18 }).toDestination();
const filter = new Tone.Filter(2200, 'lowpass').connect(reverb);
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
  // attack > 0 = soft swell instead of the piano's instant hit, still snappy
  envelope: { attack: 0.07, decay: 0.25, sustain: 0.85, release: 1.1 },
}).connect(filter);
synth.volume.value = -16;

let octave = 3;
let mod = '—';
let swiping = false; // true once a vertical drag on the right column is recognised
const latched = new Map(); // sector element -> notes[] held in latch mode

const midiToNotes = (m) => m.map(n => Tone.Frequency(n, 'midi').toNote());

async function ensureStarted() {
  if (started) return;
  await Tone.start();
  started = true;
}

// ============================ chord wheel ============================
const chordWheel = document.getElementById('chordWheel');
const chordHub = document.getElementById('chordHub');
const RING = { maj: [35, 50], min: [13, 34] }; // inner ring reaches closer to the small hub
const chordSectors = [];

ROOTS.forEach((_, rootIdx) => {
  [false, true].forEach(isMinor => {
    const [r0, r1] = isMinor ? RING.min : RING.maj;
    const c = rootIdx * 30;                 // chromatic, C at top, 30° per note
    const g = makeTile({ cls: 'tile' + (isMinor ? ' min' : ''), r0, r1, a0: c - 15, a1: c + 15,
                         label: triadLabel(rootIdx, isMinor, '—') });

    const press = async (e) => {
      g.releasePointerCapture?.(e.pointerId); // let the finger slide to a neighbour
      await ensureStarted();
      const notes = midiToNotes(triadMidi(rootIdx, octave, isMinor, mod));
      if (latchEl.checked) {
        if (latched.has(g)) { synth.triggerRelease(latched.get(g)); latched.delete(g); g.classList.remove('on'); return; }
        synth.triggerAttack(notes); latched.set(g, notes); g.classList.add('on');
      } else {
        synth.triggerAttack(notes); g.dataset.notes = JSON.stringify(notes); g.classList.add('on');
      }
      chordHub.textContent = triadLabel(rootIdx, isMinor, mod);
    };
    const release = () => {
      if (latchEl.checked) return;
      if (g.dataset.notes) { synth.triggerRelease(JSON.parse(g.dataset.notes)); g.dataset.notes = ''; }
      g.classList.remove('on');
    };
    g.addEventListener('pointerdown', press);
    g.addEventListener('pointerup', release);
    g.addEventListener('pointerleave', release);
    g.addEventListener('pointercancel', release);
    chordSectors.push(g);
  });
});
chordSectors.forEach(s => chordWheel.appendChild(s));
chordWheel.appendChild(document.getElementById('chordHubGroup')); // hub on top

// ============================ alteration wheel ============================
// Two rings like the chord wheel: outer = sevenths/extensions (added over the
// triad), inner = suspended/altered triads. Sticky single-select; centre clears.
const altWheel = document.getElementById('altWheel');
const altHub = document.getElementById('altHub');
const ALT_OUTER = ['7', 'maj7', '6', '6/9', 'add9', 'add11', '9', 'maj9', '11', '13'];
const ALT_INNER = ['sus2', 'sus4', '7sus4', '9sus4', 'aug', 'dim', 'dim7', 'm7b5', '7b5', '7#5', '7b9', '7#9'];
const altSectors = new Map(); // name -> g

function selectMod(name) {
  mod = name;
  altSectors.forEach((g, n) => g.classList.toggle('sel', n === name));
  altHub.textContent = name === '—' ? '—' : name;
}

function buildAltRing(names, r0, r1, inner) {
  const seg = 360 / names.length;
  names.forEach((name, i) => {
    const c = i * seg;
    const g = makeTile({ cls: 'tile alt' + (inner ? ' inner' : ''), r0, r1, a0: c - seg / 2, a1: c + seg / 2, label: name });
    // select on release, skipped if the touch turned into a page swipe
    g.addEventListener('pointerup', () => { if (!swiping) selectMod(name); });
    altSectors.set(name, g);
    altWheel.appendChild(g);
  });
}
buildAltRing(ALT_OUTER, ...RING.maj, false);
buildAltRing(ALT_INNER, ...RING.min, true);
altWheel.appendChild(document.getElementById('altHubGroup'));
document.getElementById('altHubGroup').addEventListener('pointerdown', () => selectMod('—'));

// ============================ notes wheel (melodies) ============================
// Page 2 of the right column. Single notes, two octaves: outer = octave+2,
// inner = octave+1, so a melody sits above the chords. Momentary, no latch.
const notesWheel = document.getElementById('notesWheel');
const notesHub = document.getElementById('notesHub');
const noteLabels = []; // refresh octave digits when the octave setting changes

function buildNoteRing(octOffset, r0, r1, inner) {
  ROOTS.forEach((name, i) => {
    const c = i * 30;
    const g = makeTile({ cls: 'tile note' + (inner ? ' inner' : ''), r0, r1, a0: c - 15, a1: c + 15, label: name });
    const refresh = () => g.setLabel(name + (octave + octOffset)); // e.g. C5 / C4
    refresh();
    noteLabels.push(refresh);
    const press = async (e) => {
      g.releasePointerCapture?.(e.pointerId); // legato: slide across notes
      await ensureStarted();
      const note = Tone.Frequency(12 * (octave + octOffset + 1) + i, 'midi').toNote();
      synth.triggerAttack(note); g.dataset.note = note; g.classList.add('on');
      notesHub.textContent = note;
    };
    const release = () => {
      if (g.dataset.note) { synth.triggerRelease(g.dataset.note); g.dataset.note = ''; }
      g.classList.remove('on');
    };
    g.addEventListener('pointerdown', press);
    g.addEventListener('pointerup', release);
    g.addEventListener('pointerleave', release);
    g.addEventListener('pointercancel', release);
    notesWheel.appendChild(g);
  });
}
buildNoteRing(2, ...RING.maj, false);
buildNoteRing(1, ...RING.min, true);
notesWheel.appendChild(document.getElementById('notesHubGroup'));

// vertical swipe on the right column flips between alterations (0) and notes (1)
const rtrack = document.getElementById('rtrack');
const dots = [...document.getElementById('pagedots').children];
let page = 0, startY = 0, startX = 0, swipeId = null;
function applyPage() {
  rtrack.style.transform = `translateY(${-page * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('on', i === page));
}
const rcol = document.getElementById('rcol');
rcol.addEventListener('pointerdown', e => { startY = e.clientY; startX = e.clientX; swiping = false; swipeId = e.pointerId; });
rcol.addEventListener('pointermove', e => {
  if (e.pointerId !== swipeId || swiping) return;
  const dy = e.clientY - startY, dx = e.clientX - startX;
  if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx)) swiping = true;
});
rcol.addEventListener('pointerup', e => {
  if (e.pointerId !== swipeId) return;
  if (swiping) {
    const dy = e.clientY - startY;
    if (dy < -40 && page < 1) page++;
    else if (dy > 40 && page > 0) page--;
    applyPage();
  }
  swipeId = null;
});
applyPage();

// ============================ settings panel ============================
const settingsEl = document.getElementById('settings');
const latchEl = document.getElementById('latch');
document.getElementById('gear').addEventListener('click', () => settingsEl.hidden = false);
document.getElementById('close').addEventListener('click', () => settingsEl.hidden = true);

const octvEl = document.getElementById('octv');
document.getElementById('oct').addEventListener('input', e => { octave = +e.target.value; octvEl.textContent = octave; noteLabels.forEach(r => r()); });
document.getElementById('atk').addEventListener('input', e => { synth.set({ envelope: { attack: +e.target.value } }); });
document.getElementById('vol').addEventListener('input', e => { synth.volume.value = +e.target.value; });

latchEl.addEventListener('change', () => {
  if (!latchEl.checked) {
    latched.forEach(n => synth.triggerRelease(n));
    latched.clear();
    chordSectors.forEach(s => s.classList.remove('on'));
  }
});
