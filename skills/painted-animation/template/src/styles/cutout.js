// cutout.js: paper cutout / shadow-puppet theatre. Every shape is a piece of coloured card with scissor-cut edges that
// shiver on the boil, a cast shadow (one light, upper left, in screen space), a pale cut edge and paper fibre. Ink
// outlines become a darker rim of the piece's own colour; ink lines become cut paper strips. Translucent fills read as
// tissue paper. Fast (~100–300 ms/frame).
// Tips: move characters like puppets — rotate parts about joints, slide pieces in from the sides; layers should look
// physically stacked, so give foreground pieces bigger shadows (o.lift, 0..2, default 1).
STYLE.name = 'cutout';
const CUT_INK = '#2A1A14';

STYLE.paper = () => frameG((c, rnd) => {
  c.fillStyle = '#E9D8B6'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { c.strokeStyle = `rgba(${rnd() < .5 ? '120,85,45' : '255,250,235'},${.05 + rnd() * .08})`; c.lineWidth = .8 + rnd(); const x = rnd() * W, y = rnd() * H, a = rnd() * TAU, l = 4 + rnd() * 18; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
});
const fibre = col => tile('fibre', col, 192, (g, s, rnd) => {
  for (let i = 0; i < 700; i++) { g.globalAlpha = .15 + rnd() * .5; g.lineWidth = .6 + rnd() * .8; g.strokeStyle = '#000'; const x = rnd() * s, y = rnd() * s, a = rnd() * TAU, l = 3 + rnd() * 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
});
function cutShadow(c, P, lift = 1) {
  const k = clamp(Math.sqrt(screenArea(P)) / 90, .25, 1) * lift;
  c.shadowColor = 'rgba(30,14,6,.6)'; c.shadowOffsetX = 7 * k; c.shadowOffsetY = 10 * k; c.shadowBlur = 5 * k;
}
const noShadow = c => { c.shadowColor = 'transparent'; c.shadowBlur = c.shadowOffsetX = c.shadowOffsetY = 0; };

paintAt = function (pts, o) {
  const c = X(), J = 1.3 / screenScale(), P = pts.map(([x, y]) => [x + jit(J), y + jit(J)]), path = pathOf(P, true, o.curv), L = fillsOf(o);
  c.save();
  if (L.length) {
    const [col0, a0] = L[0], solid = a0 > .55;
    if (solid) cutShadow(c, P, o.lift ?? 1);
    c.globalAlpha = solid ? a0 : a0 * .8; c.fillStyle = col0; c.fill(path); noShadow(c);
    for (const [col, a] of L.slice(1)) { c.globalAlpha = a * .8; c.fillStyle = col; c.fill(path); }
    c.globalAlpha = .55; c.globalCompositeOperation = 'multiply'; c.fillStyle = fibre(mixC(col0, '#6B4A2E', .55)); c.fill(path);
    c.globalCompositeOperation = 'source-over';
    if (o.hatch) hatchIn(c, path, P, { ...o.hatch, c: mixC(o.hatch.c || CUT_INK, col0, .4) }, .5);
    if (solid) { c.globalAlpha = .5; c.strokeStyle = 'rgba(255,248,232,.8)'; c.lineWidth = 1.6 / screenScale(); c.stroke(path); }   // pale cut edge
    if (o.ink !== null) { c.globalAlpha = .85; c.strokeStyle = mixC(col0, o.ink || CUT_INK, .55); c.lineWidth = bw(o.br || 'ink', o.sw) * .5; c.stroke(path); }
  } else if (o.ink !== null) {   // an outline only: a thin paper strip
    cutShadow(c, P, .5); c.strokeStyle = o.ink || CUT_INK; c.lineWidth = bw(o.br || 'ink', o.sw) * 1.2; c.lineJoin = 'round'; c.stroke(path);
  }
  c.restore();
};
inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, P => {
    const c = X(), J = 1 / screenScale(), Q = P.map(([x, y]) => [x + jit(J), y + jit(J)]);
    c.save(); cutShadow(c, Q, .45); c.strokeStyle = col === PAL.ink ? CUT_INK : col; c.lineWidth = bw(br, sw) * 1.25; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(pathOf(Q, false, curv)); c.restore();
  });
};
// light through paper: a warm lantern halo
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = X(), g = c.createRadialGradient(x, y, 0, x, y, r);
  [[0, .85], [.3, .45], [.7, .12], [1, 0]].forEach(([s, k]) => g.addColorStop(s, rgba(mixC(col, '#FFF4D8', .3), k * clamp(a))));
  c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
};
STYLE.post = (c) => {
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = .7; c.drawImage(grainC, 0, 0);
};
