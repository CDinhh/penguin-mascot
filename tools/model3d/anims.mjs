// 15 animation clip thủ tục. Mỗi clip là hàm (p, f): p ∈ [0,1] là tiến độ, f là bộ ghi tư thế.
// Quy ước: góc độ, mét. Xoay Z dương làm cánh trái (+X) dạng ra ngoài; xoay X dương làm mỏ/đầu cúi xuống.
export const HIDDEN = 0.001;
const S = (x) => Math.sin(2 * Math.PI * x);
const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** Lên dần trong [a,b], giữ tới c, xuống dần tới d. */
const pulse = (p, a, b, c, d) => sm((p - a) / (b - a)) * (1 - sm((p - c) / (d - c)));
/** Đường parabol nhảy trong [a,b]. */
const hop = (p, a, b) => { const u = (p - a) / (b - a); return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u); };
const blink = (p, at, w = 0.04) => { const d = Math.abs(p - at); return d >= w ? 0 : 1 - d / w; };

export class Pose {
  constructor(joints, attachments) { this.m = new Map(); for (const n of joints) this.m.set(n, { r: [0, 0, 0], t: [0, 0, 0], s: [1, 1, 1] }); for (const n of attachments) this.m.set(n, { r: [0, 0, 0], t: [0, 0, 0], s: [HIDDEN, HIDDEN, HIDDEN] }); }
  r(n, x = 0, y = 0, z = 0) { const o = this.m.get(n).r; o[0] += x; o[1] += y; o[2] += z; }
  t(n, x = 0, y = 0, z = 0) { const o = this.m.get(n).t; o[0] += x; o[1] += y; o[2] += z; }
  s(n, x = 1, y = x, z = x) { const o = this.m.get(n).s; o[0] *= x; o[1] *= y; o[2] *= z; }
  show(n, k = 1) { const v = Math.max(HIDDEN, k); this.m.get(n).s = [v, v, v]; }
  /** Ẩn mắt thật (khi dùng mắt cười / nhắm / tim). */
  hideEyes(k) { const v = Math.max(HIDDEN, 1 - k); this.s('eye_l', v); this.s('eye_r', v); }
  blink(k) { this.s('eye_l', 1, Math.max(HIDDEN, 1 - 0.95 * k), 1); this.s('eye_r', 1, Math.max(HIDDEN, 1 - 0.95 * k), 1); }
  wings(l, r, rx = 0) { this.r('wing_l', rx, 0, l); this.r('wing_r', rx, 0, -r); }
  tagSwing(a) { this.r('tag', 0, 0, a); this.r('tag_root', 0, 0, a * 0.3); }
}

export const CLIPS = {
  idle(p, f) {
    const b = S(p);
    f.s('body', 1 - 0.012 * b, 1 + 0.022 * b, 1 - 0.012 * b);
    f.r('head', 1.5 * b, 5 * S(p + 0.2), 2.2 * S(p - 0.1));
    f.wings(3 + 2.5 * S(p + 0.25), 3 + 2.5 * S(p + 0.25));
    f.tagSwing(5 * S(p - 0.2));
    f.blink(blink(p, 0.62));
  },
  think(p, f) {
    f.r('head', -8 + 2 * S(p), 12, 9 * (0.75 + 0.25 * S(p)));
    f.s('body', 1, 1 + 0.012 * S(p), 1);
    f.r('wing_l', -110, 0, 28 + 2 * S(2 * p));
    f.wings(0, 4 + 2 * S(p + 0.3));
    f.r('wing_l', 0, 0, 0);
    f.show('fx_question', 0.85 + 0.15 * S(2 * p)); f.t('fx_question', 0, 0.02 * S(p), 0);
    f.show('fx_brow_l'); f.t('fx_brow_l', 0, 0.012, 0); f.r('fx_brow_l', 0, 0, -10);
    f.show('fx_brow_r'); f.t('fx_brow_r', 0, -0.004, 0); f.r('fx_brow_r', 0, 0, -8);
    f.tagSwing(3 * S(p));
    f.blink(blink(p, 0.3));
  },
  sleep(p, f) {
    f.show('fx_eyes_closed'); f.hideEyes(1);
    f.r('head', 15 + 3 * S(p), 0, 3 * S(p));
    f.s('body', 1 - 0.015 * S(p), 1 + 0.03 * S(p), 1 - 0.015 * S(p));
    f.wings(4, 4);
    f.tagSwing(2 * S(p));
    for (let i = 1; i <= 3; i++) {
      const q = (p + (i - 1) / 3) % 1;
      f.show(`fx_z${i}`, Math.sin(Math.PI * q) ** 0.7); f.t(`fx_z${i}`, 0.02 + 0.1 * q, 0.22 * q, 0); f.r(`fx_z${i}`, 0, 0, 10 * S(q));
    }
  },
  dance(p, f) {
    const h = Math.abs(S(p)); // 2 nhịp mỗi vòng
    f.t('root', 0, 0.06 * h, 0);
    f.s('body', 1 + 0.02 * (1 - h), 1 + 0.045 * h - 0.02, 1 + 0.02 * (1 - h));
    f.r('body', 0, 0, 9 * S(p));
    f.r('head', 5 * h, 0, -10 * S(p));
    f.wings(70 + 45 * S(p), 70 + 45 * S(p + 0.5));
    f.t('foot_l', 0, 0.03 * Math.max(0, S(p)), 0); f.t('foot_r', 0, 0.03 * Math.max(0, -S(p)), 0);
    f.tagSwing(12 * S(p + 0.15));
    f.show('fx_eyes_happy'); f.hideEyes(1);
    f.show('fx_spark_1', Math.max(0, S(2 * p)));
    f.show('fx_spark_2', Math.max(0, S(2 * p + 0.5)));
  },
  walk(p, f) {
    const s = S(p);
    f.t('root', 0, 0.012 * Math.abs(s), 0);
    f.r('body', 0, 0, 5 * s); f.r('head', 0, 0, -3 * s);
    f.t('foot_l', 0, 0.035 * Math.max(0, s), 0.045 * s); f.r('foot_l', -12 * Math.max(0, s), 0, 0);
    f.t('foot_r', 0, 0.035 * Math.max(0, -s), -0.045 * s); f.r('foot_r', -12 * Math.max(0, -s), 0, 0);
    f.r('wing_l', 22 * s, 0, 6); f.r('wing_r', -22 * s, 0, -6);
    f.tagSwing(7 * S(p + 0.25));
    f.blink(blink(p, 0.4));
  },
  talk(p, f) {
    const o = (1 - Math.cos(4 * Math.PI * p)) / 2;
    f.r('jaw', 20 * o, 0, 0);
    f.show('fx_mouth'); f.s('fx_mouth', 1, 0.3 + 0.9 * o, 1);
    f.r('head', 3 * o, 3 * S(p), 0);
    f.wings(7 + 9 * S(p), 7 + 9 * S(p + 0.5));
    f.tagSwing(2 * S(p));
  },
  wave(p, f) {
    const e = pulse(p, 0, 0.15, 0.82, 1);
    f.r('wing_r', 0, 0, -(135 * e + 22 * e * S(3 * p)));
    f.r('wing_l', 0, 0, 4 * e);
    f.r('body', 0, 0, 4 * e); f.r('head', 0, 0, -6 * e);
    f.t('root', 0, 0.012 * e * Math.abs(S(1.5 * p)), 0);
    f.show('fx_eyes_happy', sm((e - 0.3) / 0.4)); f.hideEyes(sm((e - 0.3) / 0.4));
    f.tagSwing(8 * e * S(3 * p));
    f.show('fx_spark_1', pulse(p, 0.25, 0.35, 0.5, 0.65));
  },
  happy(p, f) {
    const e = pulse(p, 0, 0.15, 0.75, 1);
    const sq = pulse(p, 0, 0.04, 0.04, 0.12);
    const j = hop(p, 0.06, 0.55) + 0.4 * hop(p, 0.58, 0.95);
    f.t('root', 0, 0.09 * j, 0);
    f.s('body', 1 + 0.05 * sq, 1 - 0.07 * sq + 0.04 * j, 1 + 0.05 * sq);
    f.wings(100 * e, 100 * e + 10 * e * S(4 * p));
    f.r('head', -6 * e, 0, 0);
    f.show('fx_eyes_happy', e); f.hideEyes(e);
    f.tagSwing(10 * e * S(2 * p));
    f.show('fx_spark_1', pulse(p, 0.3, 0.45, 0.6, 0.8)); f.show('fx_spark_2', pulse(p, 0.38, 0.5, 0.65, 0.85));
  },
  celebrate(p, f) {
    const e = pulse(p, 0, 0.1, 0.9, 1);
    const j = hop(p, 0.05, 0.3) + hop(p, 0.35, 0.6) + 0.7 * hop(p, 0.65, 0.9);
    f.t('root', 0, 0.14 * j, 0);
    f.s('body', 1 - 0.02 * j, 1 + 0.04 * j, 1 - 0.02 * j);
    f.wings(120 * e + 15 * e * S(4 * p), 120 * e + 15 * e * S(4 * p + 0.5));
    f.r('head', -8 * e, 0, 6 * e * S(2 * p));
    f.show('fx_eyes_happy', e); f.hideEyes(e);
    f.tagSwing(14 * e * S(3 * p));
    for (let i = 0; i < 6; i++) {
      const q = clamp01((p - 0.12 - i * 0.01) / 0.8);
      const k = sm(q * 12) * (1 - sm((q - 0.85) / 0.15));
      f.show(`fx_confetti_${i + 1}`, k);
      const z = Math.min(sm(q * 6), 1 - sm((q - 0.9) / 0.1)); // về gốc ở đầu và cuối (lúc này đã ẩn)
      f.t(`fx_confetti_${i + 1}`, ((i - 2.5) * 0.11 + 0.05 * Math.sin(q * 7 + i)) * z, (0.5 * q - 0.85 * q * q) * z, 0.05 * Math.cos(q * 5 + i) * z);
      f.r(`fx_confetti_${i + 1}`, 300 * q * (1 + i * 0.2) * z, 200 * q * z, 120 * q * z);
    }
    f.show('fx_spark_1', pulse(p, 0.2, 0.3, 0.4, 0.55)); f.show('fx_spark_3', pulse(p, 0.5, 0.6, 0.7, 0.85));
  },
  sad(p, f) {
    const e = pulse(p, 0, 0.2, 0.8, 1);
    f.r('head', 20 * e + 2 * e * S(2 * p), 0, 0);
    f.s('body', 1 + 0.02 * e, 1 - 0.04 * e, 1 + 0.02 * e);
    f.wings(-10 * e, -10 * e);
    f.show('fx_brow_l', e); f.r('fx_brow_l', 0, 0, -18); f.t('fx_brow_l', 0, 0.012, 0);
    f.show('fx_brow_r', e); f.r('fx_brow_r', 0, 0, 18); f.t('fx_brow_r', 0, 0.012, 0);
    f.s('eye_l', 1, 1 - 0.15 * e, 1); f.s('eye_r', 1, 1 - 0.15 * e, 1);
    const q = clamp01((p - 0.3) / 0.5);
    f.show('fx_tear', sm(q * 8) * (1 - sm((q - 0.8) / 0.2))); f.t('fx_tear', 0, -0.11 * q * q * (1 - sm((q - 0.92) / 0.08)), 0);
    f.tagSwing(3 * e * S(2 * p));
    f.blink(blink(p, 0.55, 0.06));
  },
  surprised(p, f) {
    const e = pulse(p, 0, 0.07, 0.7, 1);
    f.t('root', 0, 0.08 * hop(p, 0, 0.3), 0);
    f.r('body', -8 * pulse(p, 0, 0.1, 0.3, 0.6), 0, 0); f.s('body', 1, 1 + 0.05 * e, 1);
    f.r('head', -8 * e, 0, 0);
    f.s('eye_l', 1 + 0.3 * e); f.s('eye_r', 1 + 0.3 * e);
    f.wings(55 * e + 3 * e * S(8 * p), 55 * e + 3 * e * S(8 * p + 0.5));
    f.show('fx_brow_l', e); f.t('fx_brow_l', 0, 0.025, 0); f.show('fx_brow_r', e); f.t('fx_brow_r', 0, 0.025, 0);
    f.r('jaw', 22 * e, 0, 0); f.show('fx_mouth', e); f.s('fx_mouth', 1, 1.2, 1);
    f.show('fx_exclaim', pulse(p, 0.05, 0.16, 0.8, 0.95)); f.t('fx_exclaim', 0, 0.015 * S(3 * p), 0);
    f.tagSwing(12 * pulse(p, 0.05, 0.2, 0.5, 1) * S(3 * p));
  },
  no(p, f) {
    const e = pulse(p, 0, 0.1, 0.9, 1);
    f.r('head', 0, 28 * e * S(2 * p), 0);
    f.r('body', 0, 6 * e * S(2 * p), 0);
    f.wings(8 * e * S(2 * p) + 4 * e, 8 * e * S(2 * p + 0.5) + 4 * e);
    f.show('fx_brow_l', e); f.r('fx_brow_l', 0, 0, 14); f.show('fx_brow_r', e); f.r('fx_brow_r', 0, 0, -14);
    f.tagSwing(9 * e * S(2 * p));
  },
  yes(p, f) {
    const e = pulse(p, 0, 0.1, 0.9, 1);
    f.r('head', 16 * e * (0.5 - 0.5 * Math.cos(4 * Math.PI * p)), 0, 0);
    f.s('body', 1, 1 - 0.015 * e * (0.5 - 0.5 * Math.cos(4 * Math.PI * p)), 1);
    f.wings(8 * e, 8 * e);
    f.show('fx_eyes_happy', 0.9 * e); f.hideEyes(0.9 * e);
    f.tagSwing(6 * e * S(2 * p));
  },
  love(p, f) {
    const e = pulse(p, 0, 0.15, 0.85, 1);
    f.show('fx_eyes_heart', e * (1 + 0.1 * S(4 * p))); f.hideEyes(e);
    f.r('wing_l', -75 * e, 0, -12 * e); f.r('wing_r', -75 * e, 0, 12 * e);
    f.r('body', 0, 0, 5 * e * S(p * 2)); f.r('head', 0, 0, 6 * e * S(2 * p + 0.25));
    f.s('body', 1, 1 + 0.015 * e * S(4 * p), 1);
    f.tagSwing(6 * e * S(2 * p));
    for (const [n, off] of [['a', 0.1], ['b', 0.3]]) {
      const q = clamp01((p - off) / 0.65);
      f.show(`fx_heart_${n}`, sm(q * 6) * (1 - sm((q - 0.8) / 0.2)));
      const z = Math.min(sm(q * 6), 1 - sm((q - 0.92) / 0.08));
      f.t(`fx_heart_${n}`, 0.06 * Math.sin(q * 6 + off * 10) * (n === 'a' ? 1 : -1) * z, 0.34 * q * (1 - sm((q - 0.92) / 0.08)), 0);
    }
  },
  streak(p, f) {
    const e = pulse(p, 0, 0.12, 0.85, 1);
    const j = hop(p, 0.1, 0.4);
    f.t('root', 0, 0.1 * j, 0);
    f.s('body', 1 + 0.03 * j, 1 + 0.03 * j, 1);
    f.wings(120 * e, 120 * e);
    f.r('head', -5 * e, 0, 3 * e * S(3 * p));
    f.show('fx_flame', e * (1 + 0.1 * S(5 * p)) * (0.9 + 0.1 * S(9 * p))); f.s('fx_flame', 1, 1 + 0.15 * S(6 * p), 1); f.t('fx_flame', 0.008 * S(7 * p), 0, 0);
    f.show('fx_brow_l', 0.7 * e); f.r('fx_brow_l', 0, 0, 12); f.show('fx_brow_r', 0.7 * e); f.r('fx_brow_r', 0, 0, -12);
    f.tagSwing(10 * e * S(3 * p));
    f.show('fx_spark_1', pulse(p, 0.3, 0.4, 0.5, 0.65)); f.show('fx_spark_2', pulse(p, 0.45, 0.55, 0.65, 0.8)); f.show('fx_spark_3', pulse(p, 0.6, 0.7, 0.8, 0.95));
  },
};
