// Định nghĩa rig và hình học của BipBip (đơn vị mét, Y lên, mặt về +Z, cao ~1 m).
import { ellipsoid, lathe, tube, box, heart, Geo } from './geometry.mjs';

/** Xương: pos là tọa độ thế giới lúc nghỉ. Thứ tự này là hợp đồng (không đổi, chỉ thêm cuối). */
export const BONES = [
  { name: 'root', parent: null, pos: [0, 0, 0] },
  { name: 'body', parent: 'root', pos: [0, 0.3, 0] },
  { name: 'head', parent: 'body', pos: [0, 0.6, 0] },
  { name: 'jaw', parent: 'head', pos: [0, 0.69, 0.23] },
  { name: 'eye_l', parent: 'head', pos: [0.115, 0.768, 0.262] },
  { name: 'eye_r', parent: 'head', pos: [-0.115, 0.768, 0.262] },
  { name: 'wing_l', parent: 'body', pos: [0.245, 0.5, 0] },
  { name: 'wing_r', parent: 'body', pos: [-0.245, 0.5, 0] },
  { name: 'tag_root', parent: 'body', pos: [0, 0.548, 0.212] },
  { name: 'tag', parent: 'tag_root', pos: [0, 0.548, 0.212] },
  { name: 'foot_l', parent: 'root', pos: [0.115, 0.06, 0.02] },
  { name: 'foot_r', parent: 'root', pos: [-0.115, 0.06, 0.02] },
];

const hex = (h) => { const c = (i) => { const v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return [c(1), c(3), c(5)]; };
export const srgb = hex;

/** Vật liệu. tex: 'fur' | 'suede' | 'tag' | null. */
export const MATERIALS = {
  fur_head: { color: '#6E798A', tex: 'fur', sheen: '#B8C2D2' },
  fur_white: { color: '#F4F4F1', tex: 'fur', sheen: '#FFFFFF' },
  fur_body: { color: '#AEB8C6', tex: 'fur', sheen: '#E2E8F0' },
  fur_belly: { color: '#CBD3DE', tex: 'fur', sheen: '#FFFFFF' },
  felt_yellow: { color: '#F2D46B', tex: 'suede', rough: 0.85, sheen: '#FFF3C4' },
  beak: { color: '#F2D46B', rough: 0.45 },
  eye: { color: '#0B0C0F', rough: 0.12 },
  eye_hl: { color: '#FFFFFF', rough: 0.2, emissive: '#FFFFFF' },
  cheek: { color: '#F59AAE', rough: 1 },
  tag: { color: '#C9873F', tex: 'tag', rough: 0.8 },
  strap: { color: '#9C8C58', tex: 'suede', rough: 1 },
  cap_navy: { color: '#26325A', rough: 0.7 },
  gold: { color: '#FFC800', rough: 0.4, emissive: '#6B5200' },
  mouth: { color: '#5A2330', rough: 0.6 },
  fx: { color: '#FFFFFF', unlit: true, vertexColor: true },
};

const INK = '#1B2440';
const paint = (g, hexColor) => { const c = hex(hexColor); g.col = []; for (let i = 0; i < g.vertexCount; i++) g.col.push(c[0], c[1], c[2]); return g; };

/** q: hệ số mịn của LOD (1, 0.6, 0.38). */
export function buildParts(q = 1) {
  const S = (n, min = 6) => Math.max(min, Math.round(n * q));
  const E = ({ seg = 24, rings = 16, uvt = [3, 2], ...o }) => ellipsoid({ ...o, seg: S(seg, 8), rings: S(rings, 5), uvt });
  const skinned = []; // { mat, bone, geo }
  const add = (mat, bone, geo) => skinned.push({ mat, bone, geo });

  // thân
  add('fur_body', 'body', E({ c: [0, 0.33, 0], r: [0.26, 0.3, 0.22], uvt: [4, 3] }));
  add('fur_belly', 'body', E({ c: [0, 0.31, 0.055], r: [0.205, 0.265, 0.19], uvt: [3, 3] }));
  // đầu: nón xám + mặt trắng
  add('fur_head', 'head', E({ c: [0, 0.78, 0], r: [0.3, 0.245, 0.265], uvt: [4, 3] }));
  add('fur_white', 'head', E({ c: [0.125, 0.735, 0.105], r: [0.155, 0.152, 0.165], seg: 20, rings: 14 }));
  add('fur_white', 'head', E({ c: [-0.125, 0.735, 0.105], r: [0.155, 0.152, 0.165], seg: 20, rings: 14 }));
  add('fur_white', 'head', E({ c: [0, 0.665, 0.075], r: [0.21, 0.115, 0.165], seg: 20, rings: 12 }));
  // mỏ
  add('beak', 'head', E({ c: [0, 0.707, 0.268], r: [0.058, 0.032, 0.048], seg: 16, rings: 10, uvt: [1, 1] }));
  add('beak', 'jaw', E({ c: [0, 0.676, 0.256], r: [0.04, 0.02, 0.034], seg: 14, rings: 8, uvt: [1, 1] }));
  // má hồng
  for (const s of [1, -1]) add('cheek', 'head', E({ c: [0.186 * s, 0.704, 0.247], r: [0.036, 0.022, 0.016], rot: [0, 38 * s, 0], seg: 12, rings: 6, uvt: [1, 1] }));
  // mắt + điểm sáng
  for (const [b, s] of [['eye_l', 1], ['eye_r', -1]]) {
    add('eye', b, E({ c: [0.115 * s, 0.768, 0.262], r: [0.033, 0.037, 0.03], seg: 14, rings: 10, uvt: [1, 1] }));
    add('eye_hl', b, E({ c: [0.115 * s + 0.009, 0.781, 0.288], r: [0.011, 0.011, 0.006], seg: 8, rings: 5, uvt: [1, 1] }));
  }
  // cánh
  for (const [b, s] of [['wing_l', 1], ['wing_r', -1]])
    add('fur_body', b, E({ c: [0.272 * s, 0.39, 0], r: [0.055, 0.14, 0.09], rot: [0, 0, 8 * s], seg: 18, rings: 12, uvt: [2, 2] }));
  // chân
  for (const [b, s] of [['foot_l', 1], ['foot_r', -1]])
    add('felt_yellow', b, E({ c: [0.115 * s, 0.04, 0.095], r: [0.083, 0.04, 0.113], seg: 18, rings: 10, uvt: [2, 1] }));
  // thẻ tròn caramel + dây da lộn khaki (xương tag_root / tag)
  const tc = [0, 0.548 - 0.07, 0.212 + 0.012];
  const R = 0.0745;
  add('tag', 'tag', lathe({ c: tc, rot: [90, 0, 0], seg: S(32, 12), uv: 'planar', uvR: R, profile: [[0, -0.01], [0.068, -0.01], [R, -0.0055], [R, 0.0055], [0.068, 0.01], [0, 0.01]] }));
  for (const s of [1, -1])
    add('strap', 'tag_root', tube({ pts: [[0.0, 0.552, 0.211], [0.035 * s, 0.585, 0.198], [0.1 * s, 0.606, 0.15], [0.2 * s, 0.612, 0.05]], radius: 0.0105, radial: S(6, 4), smooth: S(5, 2), ref: [0, 1, 0], cap: false }));

  // ---- node bật/tắt (rest scale ≈ 0, clip bật lên) ----
  const attach = []; // { name, parent, pos, parts: [{ mat, geo }] }
  const A = (name, parent, pos, ...parts) => attach.push({ name, parent, pos, parts });
  const tb = (pts, r, c, extra = {}) => ({ mat: 'fx', geo: paint(tube({ pts, radius: r, radial: S(6, 4), smooth: S(4, 1), ...extra }), c) });
  const arc = (x, y0, h, w = 0.034, n = 5) => Array.from({ length: n }, (_, i) => { const t = (i / (n - 1)) * 2 - 1; return [x + t * w, y0 + h * (1 - t * t), 0]; });
  A('fx_eyes_happy', 'head', [0, 0.775, 0.275], tb(arc(0.115, 0, 0.02), 0.0068, INK), tb(arc(-0.115, 0, 0.02), 0.0068, INK));
  A('fx_eyes_closed', 'head', [0, 0.765, 0.275], tb(arc(0.115, 0, -0.014), 0.0062, INK), tb(arc(-0.115, 0, -0.014), 0.0062, INK));
  A('fx_eyes_heart', 'head', [0, 0.77, 0.285],
    { mat: 'fx', geo: paint(heart({ c: [0.115, 0, 0], size: 0.05, seg: S(24, 12), rings: S(4, 2) }), '#FF4B6E') },
    { mat: 'fx', geo: paint(heart({ c: [-0.115, 0, 0], size: 0.05, seg: S(24, 12), rings: S(4, 2) }), '#FF4B6E') });
  for (const [n, s] of [['fx_brow_l', 1], ['fx_brow_r', -1]])
    A(n, 'head', [0.125 * s, 0.868, 0.226], tb([[-0.04 * s, 0, 0], [0, 0.004, 0.003], [0.04 * s, 0, 0]], 0.0085, INK, { ref: [0, 1, 0] }));
  A('fx_mouth', 'jaw', [0, 0.672, 0.243], { mat: 'mouth', geo: E({ r: [0.032, 0.02, 0.016], seg: 12, rings: 7, uvt: [1, 1] }) });
  // mũ cử nhân
  const capParts = [
    { mat: 'cap_navy', geo: lathe({ c: [0, -0.06, 0], profile: [[0.12, 0], [0.165, 0.0], [0.165, 0.05], [0.12, 0.06]], seg: S(20, 10) }) },
    { mat: 'cap_navy', geo: box({ c: [0, 0.012, 0], s: [0.36, 0.014, 0.36], rot: [0, 45, 0] }) },
    { mat: 'gold', geo: E({ c: [0, 0.025, 0], r: [0.013, 0.013, 0.013], seg: 8, rings: 5, uvt: [1, 1] }) },
    { mat: 'gold', geo: tube({ pts: [[0, 0.02, 0], [0.12, 0.02, 0.12], [0.16, -0.01, 0.16], [0.165, -0.07, 0.165]], radius: 0.004, radial: 4, smooth: S(4, 1) }) },
    { mat: 'gold', geo: E({ c: [0.165, -0.085, 0.165], r: [0.011, 0.02, 0.011], seg: 8, rings: 5, uvt: [1, 1] }) },
  ];
  A('fx_cap', 'head', [0, 1.0, 0], ...capParts);
  // trái tim bay, Z ngủ, giọt lệ, giọt mồ hôi, tia sáng, dấu ! và ?, lửa, hoa giấy
  A('fx_heart_a', 'root', [0.2, 0.98, 0.12], { mat: 'fx', geo: paint(heart({ size: 0.06, seg: S(24, 12), rings: S(4, 2) }), '#FF4B6E') });
  A('fx_heart_b', 'root', [-0.2, 1.02, 0.1], { mat: 'fx', geo: paint(heart({ size: 0.045, seg: S(24, 12), rings: S(4, 2) }), '#FF8FA8') });
  for (const [i, sz] of [[1, 0.03], [2, 0.04], [3, 0.052]])
    A(`fx_z${i}`, 'root', [0.2, 0.98, 0.1], tb([[-sz, sz, 0], [sz, sz, 0], [-sz, -sz, 0], [sz, -sz, 0]], sz * 0.2, '#7C8CC4', { smooth: 0 }));
  const drop = (c) => paint(lathe({ profile: [[0, -0.016], [0.008, -0.014], [0.0125, -0.006], [0.012, 0], [0.008, 0.01], [0.003, 0.02], [0, 0.026]], seg: S(10, 6) }), c);
  A('fx_tear', 'head', [0.16, 0.73, 0.255], { mat: 'fx', geo: drop('#5BC0F8') });
  A('fx_sweat', 'head', [-0.2, 0.92, 0.14], { mat: 'fx', geo: paint(lathe({ profile: [[0, -0.024], [0.012, -0.02], [0.019, -0.008], [0.017, 0.002], [0.011, 0.016], [0.004, 0.03], [0, 0.038]], seg: S(10, 6) }), '#8FD3FF') });
  const star = (s, col) => { const g = new Geo(); for (const rot of [[0, 0, 0], [0, 0, 90]]) g.merge(E({ r: [s * 0.22, s, s * 0.22], rot, seg: 8, rings: 6, uvt: [1, 1] })); return paint(g, col); };
  A('fx_spark_1', 'root', [0.3, 0.95, 0.1], { mat: 'fx', geo: star(0.05, '#FFC800') });
  A('fx_spark_2', 'root', [-0.28, 0.86, 0.12], { mat: 'fx', geo: star(0.04, '#FFE066') });
  A('fx_spark_3', 'root', [0.02, 1.16, 0.08], { mat: 'fx', geo: star(0.045, '#FFC800') });
  A('fx_exclaim', 'root', [0.25, 1.1, 0.1],
    { mat: 'fx', geo: paint(lathe({ profile: [[0, -0.01], [0.012, -0.004], [0.02, 0.04], [0.012, 0.09], [0, 0.092]], seg: S(10, 6), c: [0, 0.015, 0] }), '#FF4B4B') },
    { mat: 'fx', geo: paint(E({ c: [0, -0.012, 0], r: [0.015, 0.015, 0.015], seg: 8, rings: 5, uvt: [1, 1] }), '#FF4B4B') });
  A('fx_question', 'root', [0.25, 1.1, 0.1],
    { mat: 'fx', geo: paint(E({ c: [0, 0.04, -0.012], r: [0.055, 0.055, 0.012], seg: S(16, 8), rings: S(8, 4), uvt: [1, 1] }), '#FFFFFF') },
    tb([[-0.022, 0.05, 0], [-0.026, 0.066, 0], [0, 0.078, 0], [0.026, 0.066, 0], [0.02, 0.046, 0], [0, 0.03, 0], [0, 0.02, 0]], 0.006, '#1CB0F6'),
    { mat: 'fx', geo: paint(E({ c: [0, 0.005, 0], r: [0.008, 0.008, 0.008], seg: 8, rings: 5, uvt: [1, 1] }), '#1CB0F6') });
  const flame = new Geo();
  flame.merge(paint(lathe({ profile: [[0, 0], [0.06, 0.04], [0.085, 0.1], [0.05, 0.19], [0.012, 0.26], [0, 0.27]], seg: S(12, 6) }), '#FF9600'))
    .merge(paint(lathe({ profile: [[0, 0.01], [0.034, 0.045], [0.045, 0.09], [0.022, 0.16], [0, 0.185]], seg: S(12, 6) }), '#FFC800'));
  A('fx_flame', 'root', [0, 1.06, -0.05], { mat: 'fx', geo: flame });
  ['#58CC02', '#1CB0F6', '#FF4B4B', '#FFC800', '#CE82FF', '#FF9600'].forEach((col, i) =>
    A(`fx_confetti_${i + 1}`, 'root', [0, 1.1, 0], { mat: 'fx', geo: paint(box({ s: [0.05, 0.005, 0.03], rot: [20 * i, 30 * i, 10] }), col) }));

  return { skinned, attach };
}
