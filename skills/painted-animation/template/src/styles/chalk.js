// chalk.js: chalk on a green school blackboard. Colours are pastel chalk; fills are open hatching with dust, lighter
// over big areas so the board shows through; outlines are grainy chalk lines. Dark fills (the ink, night skies) don't
// draw chalk at all — they wipe the board clean, so an iris or a black panel reads as erased board. Fast.
// Tips: think "teacher's sketch": fewer, bolder shapes; erase-and-redraw transitions (a wipe in PAL.ink = the eraser);
// the board is dark, so light comes from chalk brightness, not from glow.
STYLE.name = 'chalk';
const BOARD = '#22392D', CHALK = '#EEECE2';

STYLE.paper = () => frameG((c, rnd) => {
  c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {   // old eraser smears
    const x = rnd() * W, y = rnd() * H, r = 120 + rnd() * 320, g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(230,240,230,${.025 + rnd() * .035})`); g.addColorStop(1, 'rgba(230,240,230,0)');
    c.save(); c.translate(x, y); c.scale(1.8, .7); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
  }
  for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(230,240,230,${rnd() * .05})`; c.fillRect(rnd() * W, rnd() * H, 1.5, 1.5); }
});
const isBoard = col => lum(col) < .24;
const chalkCol = col => isBoard(col) ? CHALK : mixC(satC(col, .1), '#FFFFFF', .3);
// open hatching, the way chalk fills an area
const hatchT = col => tile('chalkhatch', col, 256, (g, s, rnd) => {
  g.lineCap = 'round';
  for (let i = 0; i < 700; i++) {
    const x = rnd() * s, y = rnd() * s, a = .62 + (rnd() - .5) * .2, l = 14 + rnd() * 30;
    g.globalAlpha = .3 + rnd() * .55; g.lineWidth = 1.2 + rnd() * 2.2; g.strokeStyle = '#000';
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); g.stroke(); }
  }
});
// chalk line grain: a solid with lots of skipped specks
const grainT = col => tile('chalkline', col, 128, (g, s, rnd) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, s, s); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2600; i++) { g.globalAlpha = .5 + rnd() * .5; g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2); }
});
const sh = (p, k) => { const [dx, dy] = boilShift(128, k); p.setTransform(new DOMMatrix([1, 0, 0, 1, dx, dy])); return p; };
function chalkStroke(c, path, col, w) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 2; i++) { c.save(); c.translate(jit(w * .3), jit(w * .3)); c.globalAlpha = i ? .45 : .85; c.strokeStyle = sh(grainT(col), i + 11); c.lineWidth = w * (i ? .7 : 1); c.stroke(path); c.restore(); }
  c.restore();
}

paintAt = function (pts, o) {
  const c = X(), path = pathOf(pts, true, o.curv), L = fillsOf(o), big = screenArea(pts) > W * H * .25;
  c.save();
  for (const [col, a] of L) {
    if (isBoard(col)) { c.globalAlpha = a; c.fillStyle = BOARD; c.fill(path); continue; }
    const cc = chalkCol(col);
    if (a > .6) { c.globalAlpha = a; c.fillStyle = BOARD; c.fill(path); }   // an opaque shape hides the chalk behind it
    c.globalAlpha = a * (big ? .06 : .16); c.fillStyle = cc; c.fill(path);                  // dust
    c.globalAlpha = a * (big ? .3 : .85); c.fillStyle = sh(hatchT(cc), 9); c.fill(path);    // strokes
  }
  c.restore();
  if (o.hatch) hatchIn(c, path, pts, { ...o.hatch, c: chalkCol(o.hatch.c || CHALK) }, .6);
  if (o.ink !== null) chalkStroke(c, path, chalkCol(o.ink || PAL.ink), bw(o.br || 'ink', o.sw) * 1.4);
};
inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, P => chalkStroke(X(), pathOf(P, false, curv), chalkCol(col), bw(br, sw) * 1.4));
};
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = X(), g = c.createRadialGradient(x, y, 0, x, y, r);
  [[0, .6], [.35, .25], [1, 0]].forEach(([s, k]) => g.addColorStop(s, rgba(chalkCol(col), k * clamp(a))));
  c.save(); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
};
const dust = frameC((c, rnd) => { for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(235,240,232,${rnd() * .12})`; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); } });
STYLE.post = (c) => { c.drawImage(dust, 0, 0); };
