const S = 33.333;               // image scale (percent)
export const ID = {
  root: '0-373', body: '0-366', head: '0-365', shadow: '0-113', wingL: '0-367', wingR: '0-368', footL: '0-369', footR: '0-370',
  eyeL: '0-371', eyeR: '0-372', pupL: '0-105', pupR: '0-106', happy: '0-115', closed: '0-114', heart: '0-116',
  browL: '0-118', browR: '0-119', cheekL: '0-103', cheekR: '0-104', mouth: '0-117', beakB: '0-111', beakT: '0-112', cap: '0-120',
  zzz: '0-143', z: ['0-16110', '0-16137', '0-16164'], question: '0-210', exclaim: '0-168', hearts: '0-179',
  sparkles: '0-233', confettis: '0-306', tear: '0-297', sweat: '0-288', flame: '0-121'
};
// web hearts #1..#4: rive node, base scale, web origin (Pw), measured node world (N), rest local
export const HEARTS = [
  { id: '0-200', k: 1.2, P: [40, 70], N: [40, 64], L: [-63.1, -17.9] },
  { id: '0-194', k: 1.5, P: [162, 60], N: [162, 52.5], L: [58.9, -29.4] },
  { id: '0-188', k: 1, P: [150, 110], N: [150, 105], L: [46.9, 23.1] },
  { id: '0-182', k: 1.3, P: [50, 120], N: [50, 113.5], L: [-53.1, 31.6] }
];
export const SPARKLES = [{ id: '0-272', k: 1 }, { id: '0-260', k: 1.3 }, { id: '0-248', k: .8 }, { id: '0-236', k: 1 }];
export const CONF = Array.from({ length: 14 }, (_, i) => ({
  id: '0-' + (348 - 3 * i), i,
  cx: 14 + 13 * i + 3.5, cy: -6 - (i % 3) * 10 + 5.5,
  tx: ((i % 4) - 1.5) * 10, r: (i * 47) % 180 + 540, d: (i % 5) * .12
}));
export const CONF_GROUP = [102, -10.5];           // 0-308 position inside 0-306 (which sits at 0,0)
export const FACE_Y = { browL: -52.16, browR: -52.16, eyeL: -40.99, eyeR: -40.99, closed: -40.33, happy: -40.49, heart: -41.83, cheekL: -26, cheekR: -26, mouth: -28, beakB: -24.17, beakT: -36.17 };
export const FACE_X = { browL: -36, browR: 36, eyeL: -35.99, eyeR: 36.01, closed: .01, happy: 0, heart: .01, cheekL: -46, cheekR: 46, mouth: 0, beakB: 0, beakT: 0 };

// target = { c: rest components, o: [[obj, key, deps, fn]] }; fn maps components to the Rive value
export const T = {};
T.root = { c: { tx: 0, ty: 0, r: 0, sx: 1, sy: 1 }, o: [[ID.root, 13, ['tx'], c => 100 + c.tx], [ID.root, 14, ['ty'], c => 226 + c.ty], [ID.root, 15, ['r'], c => c.r], [ID.root, 16, ['sx'], c => c.sx * 100], [ID.root, 17, ['sy'], c => c.sy * 100]] };
T.body = { c: { r: 0, sx: 1, sy: 1 }, o: [[ID.body, 15, ['r'], c => c.r], [ID.body, 16, ['sx'], c => c.sx * 100], [ID.body, 17, ['sy'], c => c.sy * 100]] };
T.shadow = { c: { s: 1, o: 1 }, o: [[ID.shadow, 13, [], () => 100], [ID.shadow, 14, [], () => 227],[ID.shadow, 16, ['s'], c => S * c.s], [ID.shadow, 17, ['s'], c => S * c.s], [ID.shadow, 18, ['o'], c => c.o * 100]] };
T.wingL = { c: { r: 0 }, o: [[ID.wingL, 15, ['r'], c => c.r]] };
T.wingR = { c: { r: 0 }, o: [[ID.wingR, 15, ['r'], c => c.r]] };
T.tag = { c: { r: 0 }, o: [['0-5708', 15, ['r'], c => c.r], ['0-15353', 15, ['r'], c => c.r]] };
T.footL = { c: { ty: 0, r: 0 }, o: [[ID.footL, 14, ['ty'], c => 1 + c.ty], [ID.footL, 15, ['r'], c => c.r]] };
T.footR = { c: { ty: 0, r: 0 }, o: [[ID.footR, 14, ['ty'], c => 1 + c.ty], [ID.footR, 15, ['r'], c => c.r]] };
T.eyes = { c: { o: 1 }, o: [[ID.eyeL, 18, ['o'], c => c.o * 100], [ID.eyeR, 18, ['o'], c => c.o * 100]] };
T.blink = { c: { sy: 1 }, o: [[ID.eyeL, 17, ['sy'], c => c.sy * 100], [ID.eyeR, 17, ['sy'], c => c.sy * 100]] };
T.pupils = { c: { tx: 0, ty: 0, s: 1 }, o: [[ID.pupL, 13, ['tx'], c => c.tx], [ID.pupR, 13, ['tx'], c => c.tx], [ID.pupL, 14, ['ty'], c => c.ty], [ID.pupR, 14, ['ty'], c => c.ty], [ID.pupL, 16, ['s'], c => S * c.s], [ID.pupR, 16, ['s'], c => S * c.s], [ID.pupL, 17, ['s'], c => S * c.s], [ID.pupR, 17, ['s'], c => S * c.s]] };
T.eyesHappy = { c: { o: 0 }, o: [[ID.happy, 18, ['o'], c => c.o * 100]] };
T.eyesClosed = { c: { o: 0 }, o: [[ID.closed, 18, ['o'], c => c.o * 100]] };
// heart eyes are two separate images so each heart can pulse about its own origin (web: translate(64|136 95) scale(.78))
export const HEART_EYES = [{ id: '0-5533', x: -36, P: [64, 95], C: [64.003, 93.167] }, { id: '0-5534', x: 36, P: [136, 95], C: [136.003, 93.167] }];
T.eyesHeart = { c: { o: 0 }, o: HEART_EYES.map(h => [h.id, 18, ['o'], c => c.o * 100]) };
T.heartPulse = { c: { s: 1 }, o: HEART_EYES.flatMap(h => [[h.id, 13, ['s'], c => h.P[0] + c.s * (h.C[0] - h.P[0]) - 100], [h.id, 14, ['s'], c => h.P[1] + c.s * (h.C[1] - h.P[1]) - 135], [h.id, 16, ['s'], c => S * c.s], [h.id, 17, ['s'], c => S * c.s]]) };
T.brows = { c: { o: 0 }, o: [[ID.browL, 18, ['o'], c => c.o * 100], [ID.browR, 18, ['o'], c => c.o * 100]] };
for (const s of ['L', 'R']) T['brow' + s] = { c: { ty: 0, r: 0 }, o: [[ID['brow' + s], 14, ['ty'], c => FACE_Y['brow' + s] + c.ty], [ID['brow' + s], 15, ['r'], c => c.r]] };
T.cheeks = { c: { o: .55, s: 1 }, o: [[ID.cheekL, 18, ['o'], c => c.o * 100], [ID.cheekR, 18, ['o'], c => c.o * 100], [ID.cheekL, 16, ['s'], c => S * c.s], [ID.cheekR, 16, ['s'], c => S * c.s], [ID.cheekL, 17, ['s'], c => S * c.s], [ID.cheekR, 17, ['s'], c => S * c.s]] };
T.mouth = { c: { s: 0 }, o: [[ID.mouth, 14, ['s'], c => -28 + 5 * c.s], [ID.mouth, 17, ['s'], c => S * c.s]] };
T.beak = { c: { ty: 0 }, o: [[ID.beakB, 14, ['ty'], c => FACE_Y.beakB + c.ty]] };
// pg-face: translate every face part (mouth rests at scaleY 0 here)
T.face = { c: { tx: 0, ty: 0 }, o: Object.keys(FACE_Y).flatMap(k => [[ID[k], 13, ['tx'], c => FACE_X[k] + c.tx], [ID[k], 14, ['ty'], c => FACE_Y[k] + c.ty]]) };
T.zzz = { c: { o: 0 }, o: [[ID.zzz, 18, ['o'], c => c.o * 100]] };
// glyph outlines (no font): each node's origin is the glyph's top-left, which is the point CSS scales about (viewBox 0,0)
export const ZTL = [[134.797, 48.359], [134.996, 45.45], [135.195, 42.54]];
ID.z.forEach((id, n) => { T['z' + n] = { c: { tx: 0, ty: 0, s: 1, o: 0 }, o: [[id, 13, ['s', 'tx'], c => ZTL[n][0] * c.s + c.tx], [id, 14, ['s', 'ty'], c => ZTL[n][1] * c.s + c.ty], [id, 16, ['s'], c => c.s * 100], [id, 17, ['s'], c => c.s * 100], [id, 18, ['o'], c => c.o * 100]] }; });
const pivot = (id, P) => [[id, 13, ['s'], c => (1 - c.s) * P[0]], [id, 14, ['s', 'ty'], c => (1 - c.s) * P[1] + c.ty], [id, 16, ['s'], c => c.s * 100], [id, 17, ['s'], c => c.s * 100], [id, 18, ['o'], c => c.o * 100]];
T.question = { c: { ty: 0, s: 1, o: 0 }, o: pivot(ID.question, [150, 56]) };
T.exclaim = { c: { ty: 0, s: 1, o: 0 }, o: pivot(ID.exclaim, [168, 46]) };
T.tear = { c: { ty: 0, s: 1, o: 0 }, o: pivot(ID.tear, [-9, -3]) };
T.sweat = { c: { ty: 0, s: 1, o: 0 }, o: [[ID.sweat, 14, ['ty'], c => c.ty], [ID.sweat, 18, ['o'], c => c.o * 100]] };
T.hearts = { c: { o: 0 }, o: [[ID.hearts, 18, ['o'], c => c.o * 100]] };
HEARTS.forEach((h, n) => {
  T['heart' + n] = { c: { ty: 0, s: 1, o: 1 }, o: [
    [h.id, 13, ['s'], c => h.L[0] + h.P[0] + c.s * (h.N[0] - h.P[0]) - h.N[0]],
    [h.id, 14, ['s', 'ty'], c => h.L[1] + h.P[1] + h.k * c.ty + c.s * (h.N[1] - h.P[1]) - h.N[1]],
    [h.id, 16, ['s'], c => h.k * c.s * 100], [h.id, 17, ['s'], c => h.k * c.s * 100], [h.id, 18, ['o'], c => c.o * 100]] };
});
T.sparkles = { c: { o: 0 }, o: [[ID.sparkles, 18, ['o'], c => c.o * 100]] };
SPARKLES.forEach((p, n) => { T['sparkle' + n] = { c: { s: 1, r: 0, o: 1 }, o: [[p.id, 16, ['s'], c => p.k * c.s * 100], [p.id, 17, ['s'], c => p.k * c.s * 100], [p.id, 15, ['r'], c => c.r], [p.id, 18, ['o'], c => c.o * 100]] }; });
T.confettis = { c: { o: 0 }, o: [[ID.confettis, 18, ['o'], c => c.o * 100]] };
CONF.forEach((p, n) => { T['conf' + n] = { c: { tx: 0, ty: 0, r: 0, o: 1 }, o: [[p.id, 13, ['tx'], c => p.cx - CONF_GROUP[0] + c.tx], [p.id, 14, ['ty'], c => p.cy - CONF_GROUP[1] + c.ty], [p.id, 15, ['r'], c => c.r], [p.id, 18, ['o'], c => c.o * 100]] }; });
T.flame = { c: { sx: 0, sy: 0 }, o: [[ID.flame, 13, ['sx'], c => (1 - c.sx) * 100], [ID.flame, 14, ['sy'], c => (1 - c.sy) * 226.65], [ID.flame, 16, ['sx'], c => c.sx * 100], [ID.flame, 17, ['sy'], c => c.sy * 100]] };
