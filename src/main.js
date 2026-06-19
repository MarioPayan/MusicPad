import './style.css';
import * as Tone from 'tone';
import { ROOTS, MODS, triadMidi, triadLabel, keyChords } from './chords.js';
import { makeTile } from './tile.js';

// Cut Tone's default 100ms scheduling buffer — we trigger live on touch, not on
// a transport, so we want the chord the instant the finger lands.
// ponytail: 0.01s, not 0 — a hair of buffer avoids clicks/dropouts on mobile.
Tone.getContext().lookAhead = 0.01;

// ---- audio graph: PolySynth → lowpass (brightness) → reverb → out ----
const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.18 }).toDestination();
const filter = new Tone.Filter(2200, 'lowpass').connect(reverb);
const synth = new Tone.PolySynth(Tone.Synth).connect(filter);

// instrument presets: oscillator shape + amplitude envelope per sound
const INSTRUMENTS = {
  pad:     { oscillator: { type: 'fatsawtooth', count: 3, spread: 24 }, envelope: { attack: 0.07, decay: 0.25, sustain: 0.85, release: 1.1 } },
  strings: { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.35, decay: 0.3, sustain: 0.9, release: 1.6 } },
  organ:   { oscillator: { type: 'square' },   envelope: { attack: 0.005, decay: 0.05, sustain: 1, release: 0.2 } },
  epiano:  { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.6, sustain: 0.25, release: 0.8 } },
  pluck:   { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.003, decay: 0.25, sustain: 0, release: 0.3 } },
  bell:    { oscillator: { type: 'sine' },     envelope: { attack: 0.002, decay: 1.2, sustain: 0, release: 1.2 } },
};

// ---- persisted settings (localStorage) ----
const STORE = 'musicpad';
const cfg = Object.assign(
  { instrument: 'pad', octave: 3, attack: 0.07, volume: -16, brightness: 2200,
    reverb: 0.18, capo: 0, keyRoot: -1, scale: 'major', strum: false, latch: false },
  (() => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } })(),
);
const save = () => localStorage.setItem(STORE, JSON.stringify(cfg));

function applyInstrument(name, resetAttack = true) {
  synth.set(INSTRUMENTS[name]);
  cfg.instrument = name;
  if (resetAttack) cfg.attack = INSTRUMENTS[name].envelope.attack;
}

let mod = '—'; // current alteration — held momentarily on the right wheel, '—' = none
let swiping = false; // true once a vertical drag on the right column is recognised

// push saved settings into the audio graph
applyInstrument(cfg.instrument, false);
synth.set({ envelope: { attack: cfg.attack } });
synth.volume.value = cfg.volume;
filter.frequency.value = cfg.brightness;
reverb.wet.value = cfg.reverb;

// ---- audio unlock + screen wake lock on the first user gesture (mobile) ----
// Capture phase → runs before any pad handler, so press() can stay synchronous.
// That matters: an async press could fire triggerAttack AFTER its own pointerup
// release, orphaning the first note so it sustained forever.
let started = false, wakeLock = null;
async function keepAwake() { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} }
function unlock() {
  if (started) return;
  started = true;
  Tone.start();
  keepAwake();
  document.removeEventListener('pointerdown', unlock, true);
}
document.addEventListener('pointerdown', unlock, true);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });

// ============================ chord wheel ============================
const chordWheel = document.getElementById('chordWheel');
const chordHub = document.getElementById('chordHub');
const RING = { maj: [35, 50], min: [13, 34] }; // inner ring reaches closer to the small hub
const chordSectors = [];
const voicings = new Map(); // sounding chord tile -> { rootIdx, isMinor, notes }

const chordNotes = (rootIdx, isMinor) =>
  triadMidi(rootIdx, cfg.octave, isMinor, mod).map(n => Tone.Frequency(n + cfg.capo, 'midi').toNote());

// strum = stagger the attacks slightly instead of hitting every note at once
function attack(notes) {
  if (cfg.strum && Array.isArray(notes) && notes.length > 1) {
    const t = Tone.now();
    notes.forEach((n, i) => synth.triggerAttack(n, t + i * 0.022));
  } else synth.triggerAttack(notes);
}

function startChord(g, rootIdx, isMinor) {
  const notes = chordNotes(rootIdx, isMinor);
  attack(notes);
  voicings.set(g, { rootIdx, isMinor, notes });
  g.classList.add('on');
  chordHub.textContent = triadLabel(rootIdx, isMinor, mod);
}
function stopChord(g) {
  const v = voicings.get(g);
  if (!v) return;
  synth.triggerRelease(v.notes);
  voicings.delete(g);
  g.classList.remove('on');
}
// Alteration changed → re-voice every sounding chord, keeping common tones ringing
// (only the notes that actually differ are released/attacked).
function reVoiceAll() {
  voicings.forEach((v, g) => {
    const next = chordNotes(v.rootIdx, v.isMinor);
    const drop = v.notes.filter(n => !next.includes(n));
    const add = next.filter(n => !v.notes.includes(n));
    if (drop.length) synth.triggerRelease(drop);
    if (add.length) attack(add);
    v.notes = next;
    chordHub.textContent = triadLabel(v.rootIdx, v.isMinor, mod);
  });
}

ROOTS.forEach((_, rootIdx) => {
  [false, true].forEach(isMinor => {
    const [r0, r1] = isMinor ? RING.min : RING.maj;
    const c = rootIdx * 30;                 // chromatic, C at top, 30° per note
    const g = makeTile({ cls: 'tile' + (isMinor ? ' min' : ''), r0, r1, a0: c - 15, a1: c + 15,
                         label: triadLabel(rootIdx, isMinor, '—') });
    g.dataset.key = rootIdx + ':' + (isMinor ? 1 : 0); // for key-lock highlighting

    const press = (e) => {
      g.releasePointerCapture?.(e.pointerId); // let the finger slide to a neighbour
      if (latchEl.checked && voicings.has(g)) { stopChord(g); return; } // latch: second tap stops
      if (!voicings.has(g)) startChord(g, rootIdx, isMinor);
    };
    const release = () => { if (!latchEl.checked) stopChord(g); }; // latch holds until re-tapped
    g.addEventListener('pointerdown', press);
    g.addEventListener('pointerup', release);
    g.addEventListener('pointerleave', release);
    g.addEventListener('pointercancel', release);
    chordSectors.push(g);          // kept for latch-clearing
    chordWheel.appendChild(g);
  });
});
chordWheel.appendChild(document.getElementById('chordHubGroup')); // hub on top

// Key lock: dim the chords that aren't diatonic to the chosen key (visual aid only).
function applyKeyLock() {
  const set = cfg.keyRoot < 0 ? null : keyChords(cfg.keyRoot, cfg.scale);
  chordSectors.forEach(s => s.classList.toggle('out', set ? !set.has(s.dataset.key) : false));
}

// ============================ alteration wheel ============================
// Two rings like the chord wheel: outer = sevenths/extensions (added over the
// triad), inner = suspended/altered triads. MOMENTARY: an alteration applies
// only while held, and only colours chords that are already sounding.
const altWheel = document.getElementById('altWheel');
const altHub = document.getElementById('altHub');
const ALT_OUTER = ['7', 'maj7', '6', '6/9', 'add9', 'add11', '9', 'maj9', '11', '13'];
const ALT_INNER = ['sus2', 'sus4', '7sus4', '9sus4', 'aug', 'dim', 'dim7', 'm7b5', '7b5', '7#5', '7b9', '7#9'];
const altSectors = new Map(); // name -> g

function setMod(name) {
  mod = name;
  altSectors.forEach((g, n) => g.classList.toggle('sel', n === name));
  altHub.textContent = name;
  reVoiceAll(); // recolour any held chords live
}

function buildAltRing(names, r0, r1, inner) {
  const seg = 360 / names.length;
  names.forEach((name, i) => {
    const c = i * seg;
    const g = makeTile({ cls: 'tile alt' + (inner ? ' inner' : ''), r0, r1, a0: c - seg / 2, a1: c + seg / 2, label: name });
    g.addEventListener('pointerdown', () => setMod(name));
    const clear = () => { if (mod === name) setMod('—'); }; // release → back to plain triad
    g.addEventListener('pointerup', clear);
    g.addEventListener('pointerleave', clear);
    g.addEventListener('pointercancel', clear);
    altSectors.set(name, g);
    altWheel.appendChild(g);
  });
}
buildAltRing(ALT_OUTER, ...RING.maj, false);
buildAltRing(ALT_INNER, ...RING.min, true);
altWheel.appendChild(document.getElementById('altHubGroup'));

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
    const refresh = () => g.setLabel(name + (cfg.octave + octOffset)); // e.g. C5 / C4
    refresh();
    noteLabels.push(refresh);
    const press = (e) => {
      g.releasePointerCapture?.(e.pointerId); // legato: slide across notes
      const note = Tone.Frequency(12 * (cfg.octave + octOffset + 1) + i + cfg.capo, 'midi').toNote();
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
const $ = (id) => document.getElementById(id);
const settingsEl = $('settings');
const latchEl = $('latch');
const octvEl = $('octv'), atkEl = $('atk'), capovEl = $('capov');
const capoStr = () => (cfg.capo > 0 ? '+' : '') + cfg.capo;
$('gear').addEventListener('click', () => settingsEl.hidden = false);
$('close').addEventListener('click', () => settingsEl.hidden = true);

// reflect saved settings into the controls
function syncControls() {
  $('inst').value = cfg.instrument;
  $('oct').value = cfg.octave; octvEl.textContent = cfg.octave;
  atkEl.value = cfg.attack;
  $('capo').value = cfg.capo; capovEl.textContent = capoStr();
  $('bright').value = cfg.brightness;
  $('rev').value = cfg.reverb;
  $('vol').value = cfg.volume;
  $('keyRoot').value = cfg.keyRoot;
  $('scale').value = cfg.scale;
  $('strum').checked = cfg.strum;
  latchEl.checked = cfg.latch;
}
syncControls();
applyKeyLock();

$('inst').addEventListener('change', e => { applyInstrument(e.target.value); synth.set({ envelope: { attack: cfg.attack } }); atkEl.value = cfg.attack; save(); });
$('oct').addEventListener('input', e => { cfg.octave = +e.target.value; octvEl.textContent = cfg.octave; noteLabels.forEach(r => r()); save(); });
$('atk').addEventListener('input', e => { cfg.attack = +e.target.value; synth.set({ envelope: { attack: cfg.attack } }); save(); });
$('capo').addEventListener('input', e => { cfg.capo = +e.target.value; capovEl.textContent = capoStr(); save(); });
$('bright').addEventListener('input', e => { cfg.brightness = +e.target.value; filter.frequency.value = cfg.brightness; save(); });
$('rev').addEventListener('input', e => { cfg.reverb = +e.target.value; reverb.wet.value = cfg.reverb; save(); });
$('vol').addEventListener('input', e => { cfg.volume = +e.target.value; synth.volume.value = cfg.volume; save(); });
$('keyRoot').addEventListener('change', e => { cfg.keyRoot = +e.target.value; applyKeyLock(); save(); });
$('scale').addEventListener('change', e => { cfg.scale = e.target.value; applyKeyLock(); save(); });
$('strum').addEventListener('change', e => { cfg.strum = e.target.checked; save(); });

latchEl.addEventListener('change', () => {
  cfg.latch = latchEl.checked; save();
  if (!latchEl.checked) {
    voicings.forEach(v => synth.triggerRelease(v.notes));
    voicings.clear();
    chordSectors.forEach(s => s.classList.remove('on'));
  }
});
