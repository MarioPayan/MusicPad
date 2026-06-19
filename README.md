# Chord Pad

A browser chord pad to accompany yourself while singing. Pick a root note (12
chromatic notes), then hold a chord quality — major, minor, 5, sus, dim, aug,
6, 7, maj7, m7, m7b5, dim7, add9, 9, maj9, m9 — and it sustains while you sing.

## Run

It's a single static file. Just open `index.html` in a browser, or serve it:

```sh
python3 -m http.server
# then open http://localhost:8000
```

Audio uses the [Tone.js](https://tonejs.github.io/) Salamander piano sampler
(loaded from CDN on first use, so the first chord needs network).

- **Hold** a chord to play it; release to stop.
- **Latch**: a tap leaves it sounding, another tap stops it — handy for hands-free.
- **Octave** / **Volume** sliders adjust range and level.

## Test

```sh
node test.js   # checks the chord interval math
```

## Not done yet (add when needed)

- Physical MIDI keyboard input (Web MIDI)
- Recording / chord progressions
- Offline sound (bundle samples instead of CDN)
