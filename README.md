# MusicPad

A browser chord/melody pad to accompany yourself while singing — designed for a
**phone in landscape**. Two wheels: tap chords with one thumb, set alterations or
play single-note melodies with the other.

Built with [Vite](https://vite.dev/) + [Tone.js](https://tonejs.github.io/).
Audio is a warm synth pad (no samples, no network).

## Wheels

- **Left — chords.** Outer ring = the 12 major chords, inner ring = the 12 minors,
  chromatic with C at top. One tap = one finished chord. Centre shows what's playing.
- **Right — two pages, swipe up/down:**
  - **Alterations** (page 1): hold one to colour the chord you're already holding —
    7, maj7, 9, sus4, dim, m7b5, 7#9… Release reverts to the plain triad; an
    alteration with no chord held does nothing.
  - **Melody** (page 2): single notes across two octaves for melodies (outer = octave+2,
    inner = octave+1).
- **⚙ Settings:** instrument preset, octave, capo/transpose, attack, brightness,
  reverb, volume, strum, key lock (dims out-of-key chords), latch. All persisted
  to `localStorage`. Screen stays awake while playing (Wake Lock).

Installable as a **PWA** (Add to Home Screen) and works offline.

## Develop

```sh
npm install
npm run dev      # dev server with hot reload
npm run build    # production build to dist/
npm run preview  # serve the built dist/
npm test         # chord interval + wheel geometry math
```

## Deploy (Cloudflare Pages)

One-time auth, then deploy:

```sh
npx wrangler login      # opens a browser, authorise once
npm run deploy          # builds and pushes dist/ to Cloudflare Pages
```

Lands at `https://musicpad.pages.dev`. Project name / output dir live in
`wrangler.toml`.

## Layout

- `index.html` — markup + Vite entry
- `src/main.js` — UI wiring + audio
- `src/chords.js` — chord theory (roots, qualities, MIDI math), shared with the test
- `src/tile.js` — the single wheel-tile component (geometry + centred label)
- `src/style.css`
- `test.js`
