// Generates Rive keyframes that reproduce packages/web/penguin.js CSS animations.
export const FPS = 60;
export const EZ = { ease: [.25, .1, .25, 1], io: [.42, 0, .58, 1], out: [0, 0, .58, 1], in: [.42, 0, 1, 1], conf: [.3, .6, .5, 1], lin: null };
const mirror = p => p && [1 - p[2], 1 - p[3], 1 - p[0], 1 - p[1]];
function bez(p, x) {
  if (!p) return x;
  const X = t => 3 * (1 - t) ** 2 * t * p[0] + 3 * (1 - t) * t * t * p[2] + t ** 3;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (X(t) < x) lo = t; else hi = t; }
  return 3 * (1 - t) ** 2 * t * p[1] + 3 * (1 - t) * t * t * p[3] + t ** 3;
}
const EPS = 1e-9;
// exact sub-curve of a cubic-bezier timing function between time fractions u0..u1 (De Casteljau, renormalised)
function subEase(p, u0, u1) {
  if (!p) return null;
  const X = t => 3 * (1 - t) ** 2 * t * p[0] + 3 * (1 - t) * t * t * p[2] + t ** 3;
  const solve = u => { let lo = 0, hi = 1; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (X(m) < u) lo = m; else hi = m; } return (lo + hi) / 2; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const split = (P, t) => { const a = lerp(P[0], P[1], t), b = lerp(P[1], P[2], t), c = lerp(P[2], P[3], t), d = lerp(a, b, t), e = lerp(b, c, t), f = lerp(d, e, t); return [[P[0], a, d, f], [f, e, c, P[3]]]; };
  let P = [[0, 0], [p[0], p[1]], [p[2], p[3]], [1, 1]];
  const ts = solve(u0), te = solve(u1);
  P = split(P, te)[0];
  P = split(P, te > 0 ? ts / te : 0)[1];
  const nx = x => (x - P[0][0]) / (P[3][0] - P[0][0]), ny = y => (y - P[0][1]) / (P[3][1] - P[0][1]);
  const c = v => Math.max(-1, Math.min(1, v));
  return [nx(P[1][0]), c(ny(P[1][1])), nx(P[2][0]), c(ny(P[2][1]))];
}

// One CSS animation on one component -> segments [{a,b,va,vb,ease,hold}]
function segments(sp, comp, rest, t1) {
  const kf = sp.kf[comp], d = sp.delay || 0, N = sp.iter ?? 1, dur = sp.dur, alt = !!sp.alt;
  const first = kf[0][1], endV = (rev) => (rev ? kf[0][1] : kf[kf.length - 1][1]);
  const out = [];
  if (d > 0) out.push({ a: -1e9, b: d, va: sp.fill === 'none' ? rest : first, hold: true });
  for (let k = 0; isFinite(N) ? k < N : d + k * dur < t1 + EPS; k++) {
    const rev = alt && k % 2 === 1;
    const seq = rev ? kf.map(([p, v]) => [100 - p, v]).reverse() : kf;
    for (let j = 0; j < seq.length - 1; j++) {
      out.push({ a: d + (k + seq[j][0] / 100) * dur, b: d + (k + seq[j + 1][0] / 100) * dur, va: seq[j][1], vb: seq[j + 1][1], ease: rev ? mirror(sp.ease) : sp.ease });
    }
  }
  if (isFinite(N)) {
    const lastRev = alt && (N - 1) % 2 === 1;
    out.push({ a: d + N * dur, b: 1e9, va: sp.fill === 'none' ? rest : endV(lastRev), hold: true });
  }
  return out;
}
const valAt = (segs, t) => {
  const s = segs.find(s => t >= s.a - EPS && t < s.b - EPS) || segs[segs.length - 1];
  if (s.hold) return s.va;
  return s.va + (s.vb - s.va) * bez(s.ease, (t - s.a) / (s.b - s.a));
};
const fr = t => Math.round(t * FPS);

// -> [{f, v, ease|null|'hold'}] in frames relative to window start
export function pts(sp, comp, rest, t0, t1) {
  const segs = segments(sp, comp, rest, t1);
  const raw = [];
  // an iteration that ends on a different value than the next one starts with (e.g. the tear drop):
  // keep the end value one frame before the jump, otherwise the two keyframes collide on one frame
  for (let i = 0; i + 1 < segs.length; i++) {
    const a = segs[i], b = segs[i + 1];
    if (!a.hold && !b.hold && Math.abs(a.b - b.a) < EPS && Math.abs(a.vb - b.va) > 1e-9 && a.b > t0 + EPS && a.b < t1 + EPS) raw.push({ t: a.b - 1 / FPS, v: a.vb, ease: 'hold' });
  }
  for (const s of segs) {
    if (s.b <= t0 + EPS || s.a >= t1 - EPS) continue;
    if (s.hold) { raw.push({ t: Math.max(s.a, t0), v: s.va, ease: 'hold' }); continue; }
    if (s.a >= t0 - EPS && s.b <= t1 + EPS) { raw.push({ t: s.a, v: s.va, ease: s.ease }); continue; }
    // window cuts this segment: keep the visible part as an exact sub-curve
    const A = Math.max(s.a, t0), B = Math.min(s.b, t1);
    const u0 = (A - s.a) / (s.b - s.a), u1 = (B - s.a) / (s.b - s.a);
    raw.push({ t: A, v: s.va + (s.vb - s.va) * bez(s.ease, u0), ease: subEase(s.ease, u0, u1) });
    raw.push({ t: B, v: s.va + (s.vb - s.va) * bez(s.ease, u1), ease: null, weak: true });
  }
  raw.push({ t: t0, v: valAt(segs, t0), ease: null, weak: true });
  raw.push({ t: t1, v: valAt(segs, t1), ease: null, weak: true });
  const byF = new Map();
  for (const p of raw) {
    const f = fr(p.t - t0);
    const old = byF.get(f);
    if (!old || !p.weak) byF.set(f, { f, v: p.v, ease: p.ease });
  }
  const last = fr(t1 - t0);
  return [...byF.values()].filter(p => p.f >= 0 && p.f <= last).sort((a, b) => a.f - b.f);
}
export const cubic = e => e === 'hold' ? { interpolationType: 'hold' } : e ? { interpolationType: 'cubic', cubicParams: { x1: e[0], y1: e[1], x2: e[2], y2: e[3] } } : { interpolationType: 'linear' };
export function evalSpec(sp, comp, rest, t) { return valAt(segments(sp, comp, rest, t + 1), t); }
