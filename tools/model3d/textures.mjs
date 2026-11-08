// Texture thủ tục (tái tạo được nhờ seed): lông plush, da lộn, thẻ caramel khắc BipBip.
import { encodePNG, heightToNormal, rng } from './png.mjs';

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Lông: nhiều sợi ngắn theo phương dọc, tileable. Trả về { normal, albedo } (PNG buffer). */
export function furTextures(size = 256, seed = 7, { strands = 3200, strength = 1.5 } = {}) {
  const R = rng(seed); const h = new Float32Array(size * size); const a = new Float32Array(size * size).fill(0.9);
  for (let i = 0; i < strands; i++) {
    const x0 = R() * size, y0 = R() * size, len = 5 + R() * 9, lean = (R() - 0.5) * 0.5, wgt = 0.5 + R() * 0.5, tone = (R() - 0.5) * 0.28;
    for (let s = 0; s < len; s++) {
      const x = Math.floor(x0 + lean * s) % size, y = Math.floor(y0 + s) % size;
      const k = ((y + size) % size) * size + ((x + size) % size);
      h[k] = Math.max(h[k], wgt * (1 - Math.abs(s / len - 0.5) * 0.6));
      a[k] = Math.min(1, Math.max(0.55, a[k] + tone * 0.7));
    }
  }
  // làm mờ nhẹ 1 lần cho mềm
  const blur = (src) => { const o = new Float32Array(src.length); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let t = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) t += src[((y + dy + size) % size) * size + ((x + dx + size) % size)] * (dx === 0 && dy === 0 ? 4 : 1); o[y * size + x] = t / 12; } return o; };
  const hb = blur(h), ab = blur(a);
  const alb = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) { const v = clamp(ab[i] * 255 * 1.04); alb[i * 3] = v; alb[i * 3 + 1] = v; alb[i * 3 + 2] = v; }
  return { normal: encodePNG(size, size, heightToNormal(hb, size, size, strength)), albedo: encodePNG(size, size, alb) };
}

/** Da lộn (dây): hạt mịn, nhẹ. */
export function suedeNormal(size = 128, seed = 11) {
  const R = rng(seed); const h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) h[i] = R();
  return encodePNG(size, size, heightToNormal(h, size, size, 0.9));
}

// Nét chữ BipBip (đơn vị: B,i,p cao 1, rộng ~0.6)
const GLYPHS = {
  B: [[[0, 0], [0, 1]], [[0, 1], [0.5, 1], [0.64, 0.86], [0.5, 0.56], [0, 0.56]], [[0.5, 0.56], [0.7, 0.4], [0.52, 0.02], [0, 0]]],
  i: [[[0, 0], [0, 0.62]], [[0, 0.92], [0, 0.93]]],
  p: [[[0, -0.34], [0, 0.62]], [[0, 0.6], [0.36, 0.64], [0.52, 0.38], [0.34, 0.12], [0, 0.14]]],
};
const ADV = { B: 0.95, i: 0.45, p: 0.85 };

/** Thẻ tròn caramel: albedo + normal (vân dệt, chữ BipBip khắc, viền nổi). 256x256, mặt trước chiếu phẳng. */
export function tagTextures(size = 256, seed = 3) {
  const R = rng(seed);
  const segs = []; // đoạn nét chữ trong tọa độ ảnh
  const text = 'BipBip'; const sc = size * 0.17; const lw = size * 0.022;
  let total = 0; for (const ch of text) total += ADV[ch];
  let x = size / 2 - (total * sc) / 2; const base = size * 0.56;
  for (const ch of text) {
    for (const stroke of GLYPHS[ch]) for (let i = 0; i < stroke.length - 1; i++)
      segs.push([x + stroke[i][0] * sc, base - stroke[i][1] * sc, x + stroke[i + 1][0] * sc, base - stroke[i + 1][1] * sc]);
    x += ADV[ch] * sc;
  }
  const dseg = (px, py, [x1, y1, x2, y2]) => { const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)); };
  const mask = new Float32Array(size * size), h = new Float32Array(size * size), alb = new Uint8Array(size * size * 3);
  const cx = size / 2, rad = size / 2 - 1;
  for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) {
    let d = 1e9; for (const s of segs) d = Math.min(d, dseg(xx + 0.5, y + 0.5, s));
    mask[y * size + xx] = Math.max(0, Math.min(1, (lw - d) / 1.5 + 0.5));
  }
  const sm = (m) => { const o = new Float32Array(m.length); for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) { let t = 0, n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = xx + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < size && Y < size) { t += m[Y * size + X]; n++; } } o[y * size + xx] = t / n; } return o; };
  const mb = sm(mask);
  for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) {
    const k = y * size + xx, r = Math.hypot(xx + 0.5 - cx, y + 0.5 - cx);
    // vân dệt: sợi dọc/ngang đan xen ô 6px
    const cell = ((Math.floor(xx / 6) + Math.floor(y / 6)) & 1) === 0;
    const u = cell ? (xx % 6) : (y % 6);
    const thread = 0.5 + 0.5 * Math.cos(((cell ? y : xx) % 2) * Math.PI) * 0.3 + 0.35 * Math.sin((u / 6) * Math.PI);
    const wob = 0.96 + R() * 0.08;
    // viền khắc quanh mép (đường tròn thụt vào) tạo cảm giác nổi
    const ring = Math.exp(-(((rad * 0.86) - r) ** 2) / 6);
    const rim = Math.max(0, (r - rad * 0.93) / (rad * 0.07));
    h[k] = thread * 0.35 - mb[k] * 1.6 - ring * 0.8 + rim * 0.6;
    let v = (0.62 + thread * 0.36) * wob;
    v *= 1 - mb[k] * 0.58; v *= 1 - ring * 0.18; v *= 1 - Math.min(1, rim) * 0.12;
    const o = k * 3;
    alb[o] = clamp(v * 255 * 0.74); alb[o + 1] = clamp(v * 255 * 0.5); alb[o + 2] = clamp(v * 255 * 0.3);
  }
  return { albedo: encodePNG(size, size, alb), normal: encodePNG(size, size, heightToNormal(h, size, size, 1.4)) };
}
