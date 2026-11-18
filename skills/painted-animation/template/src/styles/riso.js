// riso.js: risograph / screen print. Every colour is split into four spot inks — fluorescent pink, blue, yellow and federal blue for the darks —
// each printed as solid or as a halftone screen at its own angle, multiplied over cream paper, and each drum slightly
// out of register (the offsets twitch on the boil). Solid shapes knock out what's under them first, so things still
// overlap; translucent fills overprint. Fast (~100–300 ms/frame).
// Tips: limit the scene palette; big flat shapes and bold silhouettes; let the misregistration jump on the beat
// (PROJECT.risoKick = 1 does this). glow() prints as a yellow-and-pink halftone burst.
STYLE.name = 'riso';
const RISO_PAPER = '#F5EEDF';
const INKS = [
  { col: '#0078BF', ang: 15, off: [-3.5, 2.5] },   // blue: takes the "cyan" of a colour
  { col: '#FF48B0', ang: 75, off: [0, 0] },         // fluorescent pink: the "magenta"
  { col: '#FFE800', ang: 0, off: [3, -2] },         // yellow
  { col: '#3D5588', ang: 45, off: [1.5, 3] },       // federal blue: the darks (and the ink lines)
];

STYLE.paper = () => frameG((c, rnd) => {
  c.fillStyle = RISO_PAPER; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 6000; i++) { c.fillStyle = `rgba(150,120,80,${rnd() * .06})`; c.fillRect(rnd() * W, rnd() * H, 1 + rnd(), 1 + rnd()); }
});
// split a colour into ink amounts 0..1, like CMYK: the shared dark part goes to federal blue (the "key"), the rest to
// blue / pink / yellow, nudged so pale colours stay pale
function inksOf(col) {
  const [c, m, y] = rgbOf(col).map(v => clamp((1 - v / 255 - .06) / .94));
  const k = Math.min(c, m, y) * .92, d = 1 - k || 1;
  return [(c - k) / d * .9, (m - k) / d * .9, (y - k) / d * .9, k * .8].map(v => Math.pow(clamp(v), 1.3));   // printed light: a riso never gets truly dark
}
const LEVELS = 8;
const dots = (ink, lv) => tile('dot' + lv, ink.col, 12, (g, s) => {
  const r = Math.sqrt(lv / LEVELS) * s * .62; g.fillStyle = '#000';
  for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]]) { g.beginPath(); g.arc(x, y, r * (x === s / 2 ? 1 : 1), 0, TAU); g.fill(); }
});
// draw `draw(c)` once per ink, multiplied, in that drum's registration; screens stay locked to the page, not the shape
function printInks(amounts, draw, solidAt = .82) {
  const c = X(), m = c.getTransform(), kick = PROJECT.risoKick ? 1 + 2 * pulse(T, 5) : 1;
  INKS.forEach((ink, i) => {
    const v = amounts[i]; if (v < .05) return;
    const [bx, by] = boilShift(1.2, i * 7), ox = ink.off[0] * kick + bx, oy = ink.off[1] * kick + by;
    c.save(); c.globalCompositeOperation = 'multiply';
    const sm = new DOMMatrix().translate(ox, oy).multiply(m); c.setTransform(sm);
    let style = ink.col;
    if (v < solidAt) { const p = dots(ink, Math.max(1, Math.round(v / solidAt * LEVELS))); p.setTransform(sm.inverse().rotate(ink.ang)); style = p; }
    draw(c, style);
    c.restore();
  });
}

paintAt = function (pts, o) {
  const c = X(), path = pathOf(pts, true, o.curv), L = fillsOf(o);
  L.forEach(([col, a], i) => {
    if (i === 0 && a > .6) { c.save(); c.globalAlpha = a; c.fillStyle = RISO_PAPER; c.fill(path); c.restore(); }   // knock out
    printInks(inksOf(col).map(v => v * (a > .6 ? 1 : a * 1.4)), (cx, s) => { cx.fillStyle = s; cx.fill(path); });
  });
  if (o.hatch) printInks(inksOf(o.hatch.c || PAL.ink), (cx, s) => { cx.save(); cx.clip(path); hatchIn(cx, path, pts, { ...o.hatch, c: s }, .9); cx.restore(); }, 0);
  if (o.ink !== null) {
    const w = bw(o.br || 'ink', o.sw) * 1.15;
    printInks(inksOf(o.ink || PAL.ink), (cx, s) => { cx.strokeStyle = s; cx.lineWidth = w; cx.lineJoin = 'round'; cx.stroke(path); }, .5);
  }
};
inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, P => { const path = pathOf(P, false, curv), w = bw(br, sw) * 1.15; printInks(inksOf(col), (cx, s) => { cx.strokeStyle = s; cx.lineWidth = w; cx.lineCap = 'round'; cx.stroke(path); }, .5); });
};
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const am = inksOf(col);
  [[1, .25], [.7, .45], [.42, .7], [.2, 1]].forEach(([k, d]) => {
    const p = new Path2D(); p.arc(x, y, r * k, 0, TAU);
    // ink can't lighten, so a light is a hole in the dark (paper showing through), then printed with its own colour
    const c = X(); c.save(); c.globalAlpha = .35 * d * clamp(a); c.fillStyle = RISO_PAPER; c.fill(p); c.restore();
    printInks(am.map((v, i) => i === 3 ? 0 : Math.min(.8, v * d * clamp(a))), (cx, s) => { cx.fillStyle = s; cx.fill(p); }, 2);
  });
};
const specks = frameC((c, rnd) => { for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(245,238,223,${.2 + rnd() * .4})`; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd()); } });
STYLE.post = (c) => {
  c.globalAlpha = .7; c.drawImage(specks, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = .5; c.drawImage(grainC, 0, 0);
};
