// The one and only wheel tile: an annular sector (`path`) with a centred label
// (`text`). Every wheel — chords, alterations, notes — builds its pads from this,
// so geometry and text-centring live in exactly one place.
const SVGNS = 'http://www.w3.org/2000/svg';
const f = (n) => n.toFixed(2);

// angle in degrees, 0 = 12 o'clock, clockwise (viewBox 0..100, centre 50,50)
export const polar = (r, deg) => {
  const a = deg * Math.PI / 180;
  return [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
};

export function sectorPath(r0, r1, a0, a1) {
  const [x1, y1] = polar(r1, a0), [x2, y2] = polar(r1, a1);
  const [x3, y3] = polar(r0, a1), [x4, y4] = polar(r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${f(x1)} ${f(y1)} A${r1} ${r1} 0 ${big} 1 ${f(x2)} ${f(y2)} `
       + `L${f(x3)} ${f(y3)} A${r0} ${r0} 0 ${big} 0 ${f(x4)} ${f(y4)} Z`;
}

// Returns the <g> element with a `.setLabel(text)` helper. The label is centred
// with text-anchor:middle (CSS) + dy:0.34em here — NOT dominant-baseline, which
// iOS Safari mis-renders, which is what made the melody labels sit off the tile.
export function makeTile({ cls = 'tile', r0, r1, a0, a1, label = '' }) {
  const g = document.createElementNS(SVGNS, 'g');
  g.setAttribute('class', cls);

  const path = document.createElementNS(SVGNS, 'path');
  path.setAttribute('d', sectorPath(r0, r1, a0, a1));

  const text = document.createElementNS(SVGNS, 'text');
  const [lx, ly] = polar((r0 + r1) / 2, (a0 + a1) / 2);
  text.setAttribute('x', f(lx));
  text.setAttribute('y', f(ly));
  text.setAttribute('dy', '0.34em');
  text.textContent = label;

  g.append(path, text);
  g.setLabel = (t) => { text.textContent = t; };
  return g;
}
