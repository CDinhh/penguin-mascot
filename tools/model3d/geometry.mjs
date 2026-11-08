// Hình học thủ tục: ellipsoid, ống, lathe, hộp, tim. Mọi hàm trả về Geo (mảng phẳng).
const D2R = Math.PI / 180;

export function rotM([rx, ry, rz]) {
  const [a, b, c] = [rx * D2R, ry * D2R, rz * D2R];
  const [sa, ca, sb, cb, sc, cc] = [Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b), Math.sin(c), Math.cos(c)];
  // R = Rz * Ry * Rx
  return [
    cc * cb, cc * sb * sa - sc * ca, cc * sb * ca + sc * sa,
    sc * cb, sc * sb * sa + cc * ca, sc * sb * ca - cc * sa,
    -sb, cb * sa, cb * ca,
  ];
}
export const mulV = (m, [x, y, z]) => [
  m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export class Geo {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.idx = []; }
  get vertexCount() { return this.pos.length / 3; }
  get triangleCount() { return this.idx.length / 3; }
  push(p, n, uv) { this.pos.push(...p); this.nrm.push(...n); this.uv.push(...uv); return this.vertexCount - 1; }
  merge(o) {
    const base = this.vertexCount;
    this.pos.push(...o.pos); this.nrm.push(...o.nrm); this.uv.push(...o.uv);
    for (const i of o.idx) this.idx.push(i + base);
    if (o.col) this.col = [...(this.col || []), ...o.col];
    return this;
  }
  /** Dịch toàn bộ đỉnh (dùng khi gắn mesh vào node con). */
  translate([dx, dy, dz]) { for (let i = 0; i < this.pos.length; i += 3) { this.pos[i] += dx; this.pos[i + 1] += dy; this.pos[i + 2] += dz; } return this; }
}

function xf(m, c, p, n) { return [mulV(m, p).map((v, i) => v + c[i]), norm(mulV(m, n))]; }

/** Ellipsoid. Cực +Y, mặt trước +Z. */
export function ellipsoid({ c = [0, 0, 0], r, rot = [0, 0, 0], seg = 16, rings = 10, uvt = [1, 1] }) {
  const g = new Geo(); const m = rotM(rot);
  for (let i = 0; i <= rings; i++) {
    const th = (Math.PI * i) / rings;
    for (let j = 0; j <= seg; j++) {
      const ph = (2 * Math.PI * j) / seg;
      const p = [Math.sin(th) * Math.sin(ph) * r[0], Math.cos(th) * r[1], Math.sin(th) * Math.cos(ph) * r[2]];
      const n = [p[0] / (r[0] * r[0]), p[1] / (r[1] * r[1]), p[2] / (r[2] * r[2])];
      const [P, N] = xf(m, c, p, norm(n));
      g.push(P, N, [(j / seg) * uvt[0], (i / rings) * uvt[1]]);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    if (i !== 0) g.idx.push(a, a + 1, b);
    if (i !== rings - 1) g.idx.push(a + 1, b + 1, b);
  }
  return g;
}

/** Quay profile [[bán kính, y], ...] (từ dưới lên) quanh trục Y. Cạnh gắt tự tách đỉnh. */
export function lathe({ c = [0, 0, 0], rot = [0, 0, 0], profile, seg = 16, uv = 'wrap', uvR = 1 }) {
  const g = new Geo(); const m = rotM(rot);
  const segN = [];
  for (let k = 0; k < profile.length - 1; k++) {
    const dr = profile[k + 1][0] - profile[k][0], dy = profile[k + 1][1] - profile[k][1];
    segN.push(norm([dy, -dr, 0]));
  }
  for (let k = 0; k < profile.length - 1; k++) {
    const nPrev = segN[k - 1], nCur = segN[k], nNext = segN[k + 1];
    const smooth = (o) => (o && o[0] * nCur[0] + o[1] * nCur[1] > 0.7 ? norm([o[0] + nCur[0], o[1] + nCur[1], 0]) : nCur);
    const ends = [[profile[k], smooth(nPrev)], [profile[k + 1], smooth(nNext)]];
    const base = g.vertexCount;
    for (const [[r, y], n] of ends) {
      for (let j = 0; j <= seg; j++) {
        const ph = (2 * Math.PI * j) / seg;
        const p = [r * Math.sin(ph), y, r * Math.cos(ph)];
        const nn = [n[0] * Math.sin(ph), n[1], n[0] * Math.cos(ph)];
        const [P, N] = xf(m, c, p, nn);
        const t = uv === 'planar' ? [p[0] / (2 * uvR) + 0.5, p[2] / (2 * uvR) + 0.5] : [j / seg, y];
        g.push(P, N, t);
      }
    }
    for (let j = 0; j < seg; j++) {
      const a = base + j, b = base + seg + 1 + j;
      g.idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return g;
}

/** Catmull-Rom làm mượt đường gấp khúc. */
export function smoothPath(pts, sub_ = 6) {
  if (pts.length < 3) return pts;
  const out = [];
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let s = 0; s < sub_; s++) {
      const t = s / sub_, t2 = t * t, t3 = t2 * t;
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      out.push([0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Ống quanh đường cong. radius: số hoặc hàm (t 0..1). Đầu ống thu nhỏ tròn nhẹ. */
export function tube({ pts, radius = 0.01, radial = 6, smooth = 4, ref = [0, 0, 1], cap = true }) {
  const path = smooth ? smoothPath(pts, smooth) : pts;
  const g = new Geo(); const N = path.length;
  const R = typeof radius === 'function' ? radius : () => radius;
  for (let i = 0; i < N; i++) {
    const t = norm(sub(path[Math.min(N - 1, i + 1)], path[Math.max(0, i - 1)]));
    let rf = ref; if (Math.abs(t[0] * rf[0] + t[1] * rf[1] + t[2] * rf[2]) > 0.95) rf = [0, 1, 0];
    const n1 = norm(cross(t, rf)), n2 = cross(t, n1);
    let rr = R(i / (N - 1));
    if (cap) { const e = Math.min(i, N - 1 - i); if (e === 0) rr *= 0.35; else if (e === 1) rr *= 0.85; }
    for (let j = 0; j <= radial; j++) {
      const a = (2 * Math.PI * j) / radial, cs = Math.cos(a), sn = Math.sin(a);
      const n = [n1[0] * cs + n2[0] * sn, n1[1] * cs + n2[1] * sn, n1[2] * cs + n2[2] * sn];
      g.push([path[i][0] + n[0] * rr, path[i][1] + n[1] * rr, path[i][2] + n[2] * rr], n, [j / radial, i / (N - 1)]);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    g.idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  return g;
}

export function box({ c = [0, 0, 0], s, rot = [0, 0, 0] }) {
  const g = new Geo(); const m = rotM(rot);
  const faces = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]],
    [[0, 0, 1], [0, 1, 0], [-1, 0, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
  ];
  for (const [n, u, v] of faces) {
    const base = g.vertexCount;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = [0, 1, 2].map((k) => (n[k] + u[k] * a + v[k] * b) * 0.5 * s[k]);
      const [P, N] = xf(m, c, p, n);
      g.push(P, N, [(a + 1) / 2, (b + 1) / 2]);
    }
    g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // sửa chiều: đảm bảo mặt hướng ra ngoài
  fixWinding(g);
  return g;
}

/** Tim phồng (dome hai mặt). Nằm trong mặt XY, phồng theo ±Z. */
export function heart({ c = [0, 0, 0], size = 0.05, rot = [0, 0, 0], bulge = 0.35, seg = 24, rings = 4 }) {
  const g = new Geo(); const m = rotM(rot);
  const outline = (t) => [16 * Math.sin(t) ** 3 / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 - 0.05];
  for (let k = 0; k <= 2 * rings; k++) {
    const s = k <= rings ? k / rings : (2 * rings - k) / rings;
    const zz = (k <= rings ? -1 : 1) * bulge * Math.sqrt(Math.max(0, 1 - s * s));
    for (let j = 0; j <= seg; j++) {
      const [ox, oy] = outline((2 * Math.PI * j) / seg);
      const p = [ox * s * size, oy * s * size, zz * size];
      const [P] = xf(m, c, p, [0, 0, 1]);
      g.push(P, [0, 0, 1], [j / seg, k / (2 * rings)]);
    }
  }
  for (let k = 0; k < 2 * rings; k++) for (let j = 0; j < seg; j++) {
    const a = k * (seg + 1) + j, b = a + seg + 1;
    g.idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  smoothNormals(g);
  const front = (2 * rings) * (seg + 1);
  if (g.nrm[front * 3 + 2] * m[8] + g.nrm[front * 3 + 1] * m[5] + g.nrm[front * 3] * m[2] < 0) {
    for (let t = 0; t < g.idx.length; t += 3) { const x = g.idx[t + 1]; g.idx[t + 1] = g.idx[t + 2]; g.idx[t + 2] = x; }
    smoothNormals(g);
  }
  return g;
}

/** Tính lại normal mượt từ mặt (gộp theo vị trí trùng). */
export function smoothNormals(g) {
  const key = (i) => g.pos.slice(i * 3, i * 3 + 3).map((v) => Math.round(v * 1e5)).join(',');
  const acc = new Map();
  for (let t = 0; t < g.idx.length; t += 3) {
    const [a, b, c] = [g.idx[t], g.idx[t + 1], g.idx[t + 2]];
    const P = (i) => g.pos.slice(i * 3, i * 3 + 3);
    const fn = cross(sub(P(b), P(a)), sub(P(c), P(a)));
    for (const i of [a, b, c]) {
      const k = key(i); const o = acc.get(k) || [0, 0, 0];
      acc.set(k, [o[0] + fn[0], o[1] + fn[1], o[2] + fn[2]]);
    }
  }
  for (let i = 0; i < g.vertexCount; i++) {
    const n = norm(acc.get(key(i)) || [0, 0, 1]);
    g.nrm[i * 3] = n[0]; g.nrm[i * 3 + 1] = n[1]; g.nrm[i * 3 + 2] = n[2];
  }
}

/** Đảo chiều tam giác nếu phần lớn quay vào trong so với normal đỉnh. */
export function fixWinding(g) {
  let agree = 0, total = 0;
  for (let t = 0; t < g.idx.length; t += 3) {
    const [a, b, c] = [g.idx[t], g.idx[t + 1], g.idx[t + 2]];
    const P = (i) => g.pos.slice(i * 3, i * 3 + 3);
    const fn = cross(sub(P(b), P(a)), sub(P(c), P(a)));
    const n = [0, 1, 2].map((k) => (g.nrm[a * 3 + k] + g.nrm[b * 3 + k] + g.nrm[c * 3 + k]));
    const d = fn[0] * n[0] + fn[1] * n[1] + fn[2] * n[2];
    if (Math.abs(d) > 1e-12) { total++; if (d > 0) agree++; }
  }
  if (total && agree < total / 2) for (let t = 0; t < g.idx.length; t += 3) { const x = g.idx[t + 1]; g.idx[t + 1] = g.idx[t + 2]; g.idx[t + 2] = x; }
  return { agree, total };
}

/** Kiểm tra winding (dùng trong test). Trả về tỉ lệ tam giác quay ra ngoài. */
export function windingRatio(g) { const { agree, total } = fixWindingDry(g); return total ? agree / total : 1; }
function fixWindingDry(g) {
  let agree = 0, total = 0;
  for (let t = 0; t < g.idx.length; t += 3) {
    const [a, b, c] = [g.idx[t], g.idx[t + 1], g.idx[t + 2]];
    const P = (i) => g.pos.slice(i * 3, i * 3 + 3);
    const fn = cross(sub(P(b), P(a)), sub(P(c), P(a)));
    const n = [0, 1, 2].map((k) => (g.nrm[a * 3 + k] + g.nrm[b * 3 + k] + g.nrm[c * 3 + k]));
    const d = fn[0] * n[0] + fn[1] * n[1] + fn[2] * n[2];
    if (Math.abs(d) > 1e-12) { total++; if (d > 0) agree++; }
  }
  return { agree, total };
}
