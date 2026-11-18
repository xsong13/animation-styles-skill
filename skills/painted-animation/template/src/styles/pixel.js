// pixel.js: retro pixel art. The frame is painted flat at full size, then shrunk to a low-res grid (PROJECT.pixel px
// per pixel, default 6 → 320×180), snapped to a limited palette with ordered dithering, and blown back up with hard
// edges. Lines are at least one big pixel thick. Fast (~50–150 ms/frame). Karaoke stays crisp (it's drawn after).
// Tips: animate on twos (onTwos(t)) for a game-sprite feel; keep shapes chunky — details under ~2 big pixels vanish.
STYLE.name = 'pixel';
const PX = PROJECT.pixel || 6, PW = Math.round(W / PX), PH = Math.round(H / PX);

STYLE.paper = () => frameG(c => { c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H); });

paintAt = function (pts, o) {
  const c = X(), path = pathOf(pts, true, o.curv), s = screenScale();
  for (const [col, a] of fillsOf(o)) { c.globalAlpha = a; c.fillStyle = col; c.fill(path); }
  c.globalAlpha = 1;
  if (o.hatch) hatchIn(c, path, pts, { ...o.hatch, w: Math.max(o.hatch.w || 1, PX * .8 / s / bw(o.hatch.b || 'HB', 1)) }, .8);
  if (o.ink !== null) { c.strokeStyle = o.ink || PAL.ink; c.lineJoin = 'miter'; c.lineWidth = Math.max(bw(o.br || 'ink', o.sw), PX * 1.1 / s); c.stroke(path); }
};
inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, P => { const c = X(); c.strokeStyle = col; c.lineCap = 'square'; c.lineWidth = Math.max(bw(br, sw), PX / screenScale()); c.stroke(pathOf(P, false, curv)); });
};
// light comes in hard steps, which the dither turns into banded pixel halos
glow = function (x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = X(); c.save();   // blended toward the light's colour (not added), so the palette snap keeps its hue
  [[1, .08], [.7, .14], [.42, .26], [.2, .5]].forEach(([k, al]) => { c.fillStyle = rgba(col, al * clamp(a)); c.beginPath(); c.arc(x, y, r * k, 0, TAU); c.fill(); });
  c.restore();
};

// The palette: the kit's colours plus a shade and a light of each, and a near-black.
const PIX_PAL = (() => {
  const base = Object.values(PAL), out = ['#120E1A', '#FFFFFF'];
  for (const c of base) out.push(c, mixC(c, PAL.ink, .38), mixC(c, '#FFFFFF', .35));
  return [...new Set(out)].map(rgbOf);
})();
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v / 16 - .47) * 16);
const pixCache = new Map();
const nearest = (r, g, b) => {
  const k = (r >> 2) << 12 | (g >> 2) << 6 | (b >> 2); let v = pixCache.get(k);
  if (v) return v;
  let best = 1e9; for (const p of PIX_PAL) { const d = (r - p[0]) ** 2 * .3 + (g - p[1]) ** 2 * .59 + (b - p[2]) ** 2 * .11; if (d < best) { best = d; v = p; } }
  pixCache.set(k, v); return v;
};
const lowC = document.createElement('canvas'); lowC.width = PW; lowC.height = PH;
const lowX = lowC.getContext('2d', { willReadFrequently: true });
STYLE.post = (c) => {
  lowX.imageSmoothingEnabled = true; lowX.imageSmoothingQuality = 'medium';
  lowX.drawImage(c.canvas, 0, 0, PW, PH);
  const id = lowX.getImageData(0, 0, PW, PH), d = id.data;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const i = (y * PW + x) * 4, e = BAYER[(y & 3) * 4 + (x & 3)];
    const p = nearest(clamp(d[i] + e, 0, 255) | 0, clamp(d[i + 1] + e, 0, 255) | 0, clamp(d[i + 2] + e, 0, 255) | 0);
    d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2];
  }
  lowX.putImageData(id, 0, 0);
  c.imageSmoothingEnabled = false; c.globalCompositeOperation = 'source-over';
  c.drawImage(lowC, 0, 0, W, H);
  c.imageSmoothingEnabled = true;
};
