// Replay the generated keyframes exactly as Rive would (cubic / hold / linear) at every frame and compare with the CSS model.
import { evalSpec } from './gen.mjs';
import { T } from './model.mjs';
import { windows, compileItems } from './compile.mjs';
const bez = (p, x) => { if (!p) return x; const X = t => 3 * (1 - t) ** 2 * t * p[0] + 3 * (1 - t) * t * t * p[2] + t ** 3; let lo = 0, hi = 1, t = x; for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (X(t) < x) lo = t; else hi = t; } return 3 * (1 - t) ** 2 * t * p[1] + 3 * (1 - t) * t * t * p[3] + t ** 3; };
const play = (list, f) => { let i = list.findIndex(p => p.f > f); if (i === -1) i = list.length; const a = list[Math.max(0, i - 1)], b = list[i]; if (!b || a.ease === 'hold' || f <= a.f) return a.v; return a.v + (b.v - a.v) * bez(a.ease, (f - a.f) / (b.f - a.f)); };
const worst = [];
for (const w of windows()) {
  const map = compileItems(w.items, w.t0, w.t1);
  const frames = Math.round((w.t1 - w.t0) * 60);
  for (const [tn, set, anim] of w.items) {
    for (const [obj, key, deps, fn] of T[tn].o) {
      const list = map.get(obj + '|' + key); if (!list) continue;
      let max = 0, at = 0;
      const step = frames > 3000 ? 7 : 1;
      for (let f = 0; f <= frames; f += step) {
        const t = w.t0 + f / 60, c = { ...T[tn].c, ...set };
        for (const d of deps) if (anim && anim.kf[d]) c[d] = evalSpec(anim, d, T[tn].c[d], t);
        const err = Math.abs(play(list, f) - fn(c));
        if (err > max) { max = err; at = f; }
      }
      worst.push([max, w.name, obj + '|' + key, at]);
    }
  }
}
worst.sort((a, b) => b[0] - a[0]);
console.log(worst.slice(0, 14).map(x => `${x[0].toFixed(3)} ${x[1]} ${x[2]} @frame ${x[3]}`).join('\n'));
