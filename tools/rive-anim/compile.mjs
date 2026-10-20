import { pts, cubic, FPS } from './gen.mjs';
import { T } from './model.mjs';
import { STATES, ONE_SHOT, BLINK } from './states.mjs';

const close = (a, b) => Math.abs(a - b) < 1e-6;
const restComps = (t) => ({ ...T[t].c });

// -> Map "obj|key" -> [{f, v, ease}]  (all frames relative to window start)
export function compileItems(items, t0, t1) {
  const out = new Map();
  const put = (obj, key, list) => {
    const k = obj + '|' + key;
    if (out.has(k)) throw new Error('duplicate output ' + k);
    out.set(k, list);
  };
  for (const [tn, set, anim] of items) {
    const tg = T[tn];
    if (!tg) throw new Error('no target ' + tn);
    const rest = tg.c;
    for (const [obj, key, deps, fn] of tg.o) {
      const animated = deps.filter(d => anim && anim.kf[d]);
      const base = { ...rest, ...set };
      if (!animated.length) {
        const v = fn(base), v0 = fn(rest);
        if (!close(v, v0)) put(obj, key, [{ f: 0, v, ease: null }]);
        continue;
      }
      const lists = animated.map(d => pts(anim, d, base[d], t0, t1));
      const frames = lists[0].map(p => p.f);
      lists.forEach(l => { if (l.length !== frames.length || l.some((p, i) => p.f !== frames[i])) throw new Error('knot mismatch for ' + tn + ' ' + deps); });
      put(obj, key, frames.map((f, i) => {
        const c = { ...base };
        animated.forEach((d, j) => { c[d] = lists[j][i].v; });
        return { f, v: fn(c), ease: lists[0][i].ease };
      }));
    }
  }
  return out;
}

// state name -> list of windows {name, len(s), loop, t0, t1}
export function windows() {
  const w = [];
  for (const [n, s] of Object.entries(STATES)) {
    if (ONE_SHOT[n]) { w.push({ name: n, items: s.items, t0: 0, t1: ONE_SHOT[n], loop: 0 }); continue; }
    const T0 = s.T0 || 0;
    if (T0) w.push({ name: n + '_start', items: s.items, t0: 0, t1: T0, loop: 0 });
    w.push({ name: n, items: s.items, t0: T0, t1: T0 + s.P, loop: 1 });
  }
  w.push({ name: 'blink', items: BLINK.items, t0: 0, t1: BLINK.len, loop: 1 });
  return w;
}

export function toKeyframes(map) {
  const adds = [];
  for (const [k, list] of map) {
    const [objectId, key] = k.split('|');
    // drop redundant interior points only when exactly collinear is too fancy; keep as sampled
    list.forEach(p => adds.push({ objectId, propertyKey: Number(key), frame: p.f, value: Math.round(p.v * 1e4) / 1e4, ...cubic(p.ease) }));
  }
  return adds;
}

// rest pose: every output of every target at its rest components
export function restKeyframes() {
  const seen = new Map();
  for (const tn of Object.keys(T)) {
    for (const [obj, key, , fn] of T[tn].o) {
      const v = Math.round(fn(restComps(tn)) * 1e4) / 1e4;
      const k = obj + '|' + key;
      if (seen.has(k) && !close(seen.get(k), v)) throw new Error('rest conflict ' + k + ' ' + seen.get(k) + ' vs ' + v);
      seen.set(k, v);
    }
  }
  // fixed extras: mouth is always rendered (it is scaled to 0 at rest); cap off; flame node visible
  seen.set('0-117|18', 100); seen.set('0-121|18', 100);
  return [...seen].map(([k, v]) => { const [o, p] = k.split('|'); return { objectId: o, propertyKey: Number(p), frame: 0, value: v, interpolationType: 'linear' }; });
}
