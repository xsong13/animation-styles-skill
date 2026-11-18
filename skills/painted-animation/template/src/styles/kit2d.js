// kit2d.js: shared toolkit for the non-watercolour styles. They render on a plain 2D canvas (p5 in P2D mode, no
// p5.brush) and replace paintAt / inkLine / glow / flash with their own marks, so scenes and Clawd work unchanged.
// Everything here is still a pure function of t: randomness comes from jit()/random() (seeded per boil by boilSeed)
// or from hash(), never Math.random().
STYLE.p2d = true;

const X = () => drawingContext;
// p5.brush stroke widths (px at sw = 1) for the brushes the kit uses, so a line keeps its weight across styles.
const BRUSH_W = { ink: 3.6, inkfine: 2.2, dry: 9, charcoal: 4, HB: 1.6, '2B': 2, cpencil: 2, pen: 2, marker: 5, rotring: 1.6 };
const bw = (br, sw) => (BRUSH_W[br] ?? 2.6) * (sw ?? 1);

// ---------- colour ----------
function rgbOf(c) {
  if (typeof c !== 'string') return [0, 0, 0];
  if (c[0] === '#') { const v = parseInt(c.length === 4 ? c.slice(1).split('').map(h => h + h).join('') : c.slice(1, 7), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
const lum = c => { const [r, g, b] = rgbOf(c); return (.299 * r + .587 * g + .114 * b) / 255; };
const hexOf = ([r, g, b]) => '#' + ((1 << 24) + (clamp(Math.round(r), 0, 255) << 16) + (clamp(Math.round(g), 0, 255) << 8) + clamp(Math.round(b), 0, 255)).toString(16).slice(1);
const rgba = (c, a) => { const [r, g, b] = rgbOf(c); return `rgba(${r},${g},${b},${a})`; };
const mixC = (a, b, k) => hexOf(rgbOf(a).map((v, i) => lerp(v, rgbOf(b)[i], clamp(k))));
// push saturation away from grey (k > 0) or toward it (k < 0)
const satC = (c, k) => { const p = rgbOf(c), m = (p[0] + p[1] + p[2]) / 3; return hexOf(p.map(v => m + (v - m) * (1 + k))); };

// The fill layers a paint() call asks for, as [colour, alpha]. wash is the opaque base; fill is a watercolour glaze
// (translucent, often a shade laid over the wash); a hatch-only shape counts as a light fill of the hatch colour.
function fillsOf(o) {
  const L = [];
  if (o.wash) L.push([o.wash, clamp((o.washOp ?? 255) / 255)]);
  if (o.fill) L.push([o.fill, clamp((o.fillOp ?? 170) / 255) * (o.wash ? .55 : .7)]);
  return L;
}

// ---------- geometry ----------
function smoothClosed(P, n = 5) {
  const N = P.length, out = [];
  for (let i = 0; i < N; i++) {
    const p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (p2[d] - p0[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * u3)));
    }
  }
  return out;
}
function pathOf(P, closed = true, curv = 0) {
  const Q = curv && P.length > 2 ? (closed ? smoothClosed(P) : through(P)) : P, p = new Path2D();
  if (!Q.length) return p;
  p.moveTo(Q[0][0], Q[0][1]); for (let i = 1; i < Q.length; i++) p.lineTo(Q[i][0], Q[i][1]);
  if (closed) p.closePath();
  return p;
}
function bboxOf(P) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1 - x0, y1 - y0];
}
// on-screen size of a shape (px²), through the current camera / transforms
const screenScale = () => { const m = X().getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); };
const screenArea = P => { const [, , w, h] = bboxOf(P), s = screenScale(); return w * h * s * s; };

// ---------- textures ----------
// A tile is drawn once as an alpha mask (draw(g, size, rnd)), tinted per colour, and cached as a repeating pattern.
const PATTERNS = new Map();
function tile(key, col, size, draw) {
  const k = key + '|' + col; let p = PATTERNS.get(k);
  if (p) return p;
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d');
  draw(g, size, lcg(7 + key.length * 31));
  g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, size, size);
  p = X().createPattern(cv, 'repeat'); PATTERNS.set(k, p);
  return p;
}
// Make a full-frame p5.Graphics from a 2D drawing function (for paper / boards / overlays).
function frameG(draw) { const g = createGraphics(W, H); g.pixelDensity(1); draw(g.drawingContext, lcg(11)); return g; }
function frameC(draw) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; draw(cv.getContext('2d'), lcg(13)); return cv; }
// screen-space offset that changes with the boil (12 fps), so textures shimmer like redrawn frames
const boilShift = (k = 1, salt = 0) => [(hash(BOILN * 1.31 + salt) - .5) * 2 * k, (hash(BOILN * 2.17 + salt + 5) - .5) * 2 * k];

// Hatch lines inside a path (p5.brush's hatch option): spacing d px, angle a.
function hatchIn(c, path, P, h, alpha = 1) {
  const [x, y, w, hh] = bboxOf(P), d = Math.max(4, h.d || 20), r = Math.hypot(w, hh) / 2 + d, cx = x + w / 2, cy = y + hh / 2;
  c.save(); c.clip(path); c.translate(cx, cy); c.rotate(h.a || 0);
  c.strokeStyle = h.c || PAL.ink; c.lineWidth = bw(h.b || 'HB', h.w || 1); c.globalAlpha *= alpha; c.lineCap = 'round';
  c.beginPath(); for (let v = -r; v <= r; v += d) { c.moveTo(-r, v + jit(d * .15)); c.lineTo(r, v + jit(d * .15)); } c.stroke();
  c.restore();
}

// ---------- shared overrides ----------
flushBrush = () => {};
// A flash is light over the whole frame, in any style.
flash = function (k, col = '#FFFDF6') {
  if (k <= .01) return; const c = X(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = clamp(k); c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore();
};
// default light: an additive radial halo (styles may replace it)
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = X(), rr = r * (1 + jit(.03)), g = c.createRadialGradient(x, y, 0, x, y, rr);
  [[0, .9], [.18, .7], [.45, .28], [.75, .07], [1, 0]].forEach(([s, k]) => g.addColorStop(s, rgba(col, k * .75 * clamp(a))));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); c.restore();
};
