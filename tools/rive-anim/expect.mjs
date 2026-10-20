import { evalSpec } from './gen.mjs';
import { T } from './model.mjs';
import { STATES, ONE_SHOT } from './states.mjs';
const LOOP = ['idle', 'think', 'sleep', 'dance', 'walk', 'talk'];
const r2 = v => Math.round(v * 100) / 100;
export function expectedAt(state, t) {
  const items = STATES[state].items, out = {};
  for (const [tn, set, anim] of items) {
    const comps = { ...T[tn].c, ...set };
    for (const c of Object.keys(T[tn].c)) {
      if (anim && anim.kf[c]) comps[c] = evalSpec(anim, c, T[tn].c[c], t);
      if (!(anim && anim.kf[c]) && !(c in set)) continue;
      out[tn + '.' + c] = r2(comps[c]);
    }
  }
  return out;
}
export const restTable = () => { const o = {}; for (const [tn, tg] of Object.entries(T)) for (const [c, v] of Object.entries(tg.c)) o[tn + '.' + c] = v; return o; };
export const times = s => LOOP.includes(s) ? [0.35, 1.1, 2.6, 4.3] : [0.1, 0.4, 0.7, 0.95].map(f => +(ONE_SHOT[s] * f).toFixed(3));
