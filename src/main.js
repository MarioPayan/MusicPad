import './style.css';
import * as Tone from 'tone';
import { ROOTS, QUALITIES, chordMidi, chordLabel } from './chords.js';

// Salamander piano sampler — sounds nicer to sing over than raw oscillators.
// Samples load from the Tone.js CDN; the first chord needs network.
let started = false;
const sampler = new Tone.Sampler({
  urls: { A1:'A1.mp3', A2:'A2.mp3', A3:'A3.mp3', A4:'A4.mp3', C2:'C2.mp3', C3:'C3.mp3', C4:'C4.mp3', C5:'C5.mp3' },
  baseUrl: 'https://tonejs.github.io/audio/salamander/',
  release: 1,
}).toDestination();
sampler.volume.value = -8;

let selectedRoot = 0;
let octave = 3;
const latched = new Map(); // qualityName -> notes[] held in latch mode

const notesFor = (qual) => chordMidi(selectedRoot, octave, qual).map(m => Tone.Frequency(m, 'midi').toNote());

async function ensureStarted() {
  if (started) return;
  await Tone.start();
  started = true;
}

const rootsEl = document.getElementById('roots');
const qualsEl = document.getElementById('quals');
const nowEl = document.getElementById('now');
const latchEl = document.getElementById('latch');

// root buttons
ROOTS.forEach((r, i) => {
  const b = document.createElement('button');
  b.textContent = r;
  if (i === selectedRoot) b.classList.add('sel');
  b.addEventListener('pointerdown', async () => {
    await ensureStarted();
    selectedRoot = i;
    [...rootsEl.children].forEach(c => c.classList.remove('sel'));
    b.classList.add('sel');
  });
  rootsEl.appendChild(b);
});

// quality buttons
Object.keys(QUALITIES).forEach(qual => {
  const b = document.createElement('button');
  b.textContent = qual;

  const press = async () => {
    await ensureStarted();
    if (latchEl.checked) {
      if (latched.has(qual)) { sampler.triggerRelease(latched.get(qual)); latched.delete(qual); b.classList.remove('on'); return; }
      const n = notesFor(qual); sampler.triggerAttack(n); latched.set(qual, n); b.classList.add('on');
    } else {
      const n = notesFor(qual); sampler.triggerAttack(n); b.dataset.notes = JSON.stringify(n); b.classList.add('on');
    }
    nowEl.innerHTML = chordLabel(selectedRoot, qual);
  };
  const release = () => {
    if (latchEl.checked) return; // latch releases on next press
    if (b.dataset.notes) { sampler.triggerRelease(JSON.parse(b.dataset.notes)); b.dataset.notes = ''; }
    b.classList.remove('on');
  };

  b.addEventListener('pointerdown', press);
  b.addEventListener('pointerup', release);
  b.addEventListener('pointerleave', release);
  b.addEventListener('pointercancel', release);
  qualsEl.appendChild(b);
});

// controls
const octEl = document.getElementById('oct'), octvEl = document.getElementById('octv');
octEl.addEventListener('input', () => { octave = +octEl.value; octvEl.textContent = octave; });
document.getElementById('vol').addEventListener('input', e => { sampler.volume.value = +e.target.value; });

// turning latch off kills anything still held
latchEl.addEventListener('change', () => {
  if (!latchEl.checked) {
    latched.forEach(n => sampler.triggerRelease(n));
    latched.clear();
    [...qualsEl.children].forEach(c => c.classList.remove('on'));
  }
});
