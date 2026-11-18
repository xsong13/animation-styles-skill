// crayon.js: a child's crayon drawing. Fills are waxy streaks that let the paper tooth show through and spill a little
// over the edge; outlines are pressed crayon lines drawn twice, slightly off. The streak texture is redrawn on every
// boil, so the whole picture shimmers like a flip-book. Fast (~100–300 ms/frame).
// Tips: bright, saturated colours; simple, lumpy shapes; exaggerated poses. Crayon can't do soft light, so glow() is
// a scribbled halo.
STYLE.name = 'crayon';

STYLE.paper = () => frameG((c, rnd) => {
  c.fillStyle = '#FBF8EF'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(120,105,80,${.03 + rnd() * .05})`; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); }
});
// wax streaks: short diagonal strokes of varying pressure
const wax = col => tile('wax', col, 256, (g, s, rnd) => {
  g.lineCap = 'round';
  for (let i = 0; i < 1500; i++) {
    const x = rnd() * s, y = rnd() * s, a = -.55 + (rnd() - .5) * .35, l = 10 + rnd() * 26;
    g.globalAlpha = .25 + rnd() * .6; g.lineWidth = 1.5 + rnd() * 3; g.strokeStyle = '#000';
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); g.stroke(); }
  }
});
// a crayon line's broken edge
const waxLine = col => tile('waxline', col, 128, (g, s, rnd) => {
  g.fillStyle = '#000'; g.globalAlpha = .9; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { g.globalAlpha = .4 + rnd() * .6; g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2.5, 1 + rnd() * 1.5); }
});
function shifted(p, k) { const [dx, dy] = boilShift(128, k); p.setTransform(new DOMMatrix([1, 0, 0, 1, dx, dy])); return p; }
function crayonStroke(c, path, col, w) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    c.save(); c.translate(jit(w * .35), jit(w * .35));
    c.globalAlpha = i ? .55 : .9; c.strokeStyle = shifted(waxLine(col), i + 3); c.lineWidth = w * (i ? .8 : 1.15); c.stroke(path);
    c.restore();
  }
  c.restore();
}

paintAt = function (pts, o) {
  const c = X(), path = pathOf(pts, true, o.curv), L = fillsOf(o);
  for (const [col0, a] of L) {
    const col = satC(col0, .15);
    c.save();
    c.globalAlpha = a * .92; c.fillStyle = mixC(col, '#FBF8EF', .22); c.fill(path);   // the waxy base hides what's behind
    c.globalAlpha = a; c.fillStyle = shifted(wax(col), 1); c.fill(path);
    c.globalAlpha = a * .5; c.fillStyle = shifted(wax(mixC(col, PAL.ink, .25)), 2); c.translate(jit(3), jit(3)); c.fill(path);   // a second pass, a bit off
    c.restore();
  }
  if (o.hatch) hatchIn(c, path, pts, o.hatch, .7);
  if (o.ink !== null) crayonStroke(c, path, o.ink || PAL.ink, bw(o.br || 'ink', o.sw) * 1.5);
};
inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, P => crayonStroke(X(), pathOf(P, false, curv), col, bw(br, sw) * 1.5));
};
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = X(); c.save(); c.globalAlpha = .45 * clamp(a); c.fillStyle = shifted(wax(satC(col, .2)), 7);
  c.beginPath(); c.arc(x, y, r * .6, 0, TAU); c.fill(); c.globalAlpha = .25 * clamp(a); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
};
// paper tooth: specks where the wax skipped
const tooth = frameC((c, rnd) => { for (let i = 0; i < 26000; i++) { c.fillStyle = `rgba(255,253,246,${.25 + rnd() * .5})`; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 1.8, 1 + rnd() * 1.2); } });
STYLE.post = (c) => {
  c.globalAlpha = .8; c.drawImage(tooth, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = .45; c.drawImage(grainC, 0, 0);
};
