// neon.js: neon signs / cyberpunk. The world is dark: fills become deep, dark versions of their colour (so things still
// hide what's behind them), and every outline is a glowing tube in the shape's own bright colour, with a white-hot core.
// Bright fills (stars, moons, lamps) shine. Dark details (eyes, mouths) become pale tubes. Scanlines and a vignette
// finish the frame. Medium speed (~150–400 ms/frame; glow blur is the cost).
// Tips: night scenes, rain, cities, synth music. Fewer, cleaner outlines read better than busy ones; flicker a tube
// with hash(beatN(t)) for a sign that's on the blink; glow() is at home here.
STYLE.name = 'neon';
const NIGHT_BG = '#0A0718';

STYLE.paper = () => frameG((c, rnd) => {
  c.fillStyle = NIGHT_BG; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(120,140,255,${rnd() * .05})`; c.fillRect(rnd() * W, rnd() * H, 1, 1); }
});
const tubeCol = col => { const l = lum(col); return l < .3 ? '#BFF4FF' : mixC(satC(col, .45), '#FFFFFF', l > .75 ? 0 : .12); };
const darkCol = col => mixC(satC(col, .2), NIGHT_BG, .8);
function tube(c, path, col, w) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.shadowColor = col; c.shadowBlur = Math.max(12, w * 3.2 * screenScale());
  c.strokeStyle = col; c.lineWidth = w; c.stroke(path); c.stroke(path);
  c.shadowBlur = 0; c.strokeStyle = mixC(col, '#FFFFFF', .7); c.lineWidth = w * .38; c.stroke(path);
  c.restore();
}

paintAt = function (pts, o) {
  const c = X(), path = pathOf(pts, true, o.curv), L = fillsOf(o), small = screenArea(pts) < 9000;
  let edge = null;
  c.save();
  for (const [col, a] of L) {
    const l = lum(col);
    if (l > .78) {   // it shines
      c.shadowColor = col; c.shadowBlur = small ? 14 : 30; c.globalAlpha = a; c.fillStyle = mixC(col, '#FFFFFF', .25); c.fill(path); c.shadowBlur = 0;
    } else if (l < .2 && small && o.ink === null) {   // a dark detail on a character: draw it as a pale tube
      edge = edge || '#BFF4FF';
    } else { c.globalAlpha = a; c.fillStyle = darkCol(col); c.fill(path); edge = edge || col; }
  }
  c.restore();
  if (o.hatch) hatchIn(c, path, pts, { ...o.hatch, c: tubeCol(o.hatch.c || '#BFF4FF') }, .5);
  if (o.ink !== null || (edge && small)) {
    const ink = o.ink && lum(o.ink) > .3 ? o.ink : edge || '#BFF4FF';
    tube(c, path, tubeCol(ink), Math.max(2, bw(o.br || 'ink', o.sw) * 1.1));
  }
};
inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, P => tube(X(), pathOf(P, false, curv), tubeCol(col), Math.max(2, bw(br, sw) * 1.1)));
};
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = X(), rr = r * (1 + jit(.03)), g = c.createRadialGradient(x, y, 0, x, y, rr);
  [[0, 1], [.2, .7], [.5, .25], [1, 0]].forEach(([s, k]) => g.addColorStop(s, rgba(satC(col, .3), k * clamp(a))));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); c.restore();
};
const scan = frameC(c => {
  c.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
  const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,.6)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
});
STYLE.post = (c) => { c.drawImage(scan, 0, 0); };
