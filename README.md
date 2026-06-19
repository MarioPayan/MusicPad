# Chord Pad

A browser chord pad to accompany yourself while singing. Pick a root note (12
chromatic notes), then hold a chord quality — major, minor, 5, sus2/4, dim,
aug, 6, m6, 7, maj7, m7, m7b5, dim7, add9, 9, maj9, m9 — and it sustains while
you sing.

Built with [Vite](https://vite.dev/) + [Tone.js](https://tonejs.github.io/).

## Develop

```sh
npm install
npm run dev      # dev server with hot reload
npm run build    # production build to dist/
npm run preview  # serve the built dist/
npm test         # chord interval math
```

Audio uses the Tone.js Salamander piano sampler (loaded from CDN on first use,
so the first chord needs network).

- **Hold** a chord to play it; release to stop.
- **Latch**: a tap leaves it sounding, another tap stops it — handy for hands-free.
- **Octave** / **Volume** sliders adjust range and level.

## Layout

- `index.html` — markup + Vite entry
- `src/main.js` — UI wiring + audio
- `src/chords.js` — chord theory (roots, qualities, MIDI math), shared with the test
- `src/style.css`
- `test.js`

## Not done yet (add when needed)

- Physical MIDI keyboard input (Web MIDI)
- Recording / chord progressions
- Offline sound (bundle samples instead of CDN)
