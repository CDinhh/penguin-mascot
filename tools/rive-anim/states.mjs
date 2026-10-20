import { EZ } from './gen.mjs';
import { CONF } from './model.mjs';

const kf = (o) => o;
// helpers that mirror the CSS keyframes in packages/web/penguin.js
const jump = (n, dur, delay = 0) => ({ dur, delay, iter: n, ease: EZ.out, fill: 'both', kf: kf({
  ty: [[0, 0], [15, 0], [45, -36], [70, 0], [85, 0], [100, 0]],
  sx: [[0, 1], [15, 1.1], [45, .94], [70, 1.08], [85, .98], [100, 1]],
  sy: [[0, 1], [15, .88], [45, 1.07], [70, .92], [85, 1.02], [100, 1]] }) });
const shadowJump = (n, dur) => ({ dur, iter: n, ease: EZ.out, fill: 'both', kf: { s: [[0, 1], [15, 1], [45, .6], [70, 1], [100, 1]], o: [[0, 1], [15, 1], [45, .5], [70, 1], [100, 1]] } });
const flap = (side, dur, delay = 0, iter = Infinity, fill = 'none') => ({ dur, delay, iter, alt: true, ease: EZ.io, fill, kf: { r: [[0, 0], [100, side * 55]] } });
const cheer = (side, dur) => ({ dur, iter: Infinity, alt: true, ease: EZ.io, fill: 'none', kf: { r: [[0, side * 115], [100, side * 150]] } });
const step = (dur, delay = 0) => ({ dur, delay, iter: Infinity, ease: EZ.io, fill: 'none', kf: { ty: [[0, 0], [25, -7], [50, 0], [100, 0]], r: [[0, 0], [25, -8], [50, 0], [100, 0]] } });
const twinkle = (d, iter = 1, dur = 1.2) => ({ dur, delay: d, iter, ease: EZ.out, fill: 'both', kf: { o: [[0, 0], [40, 1], [100, 0]], s: [[0, 0], [40, 1.2], [100, .8]], r: [[0, 0], [40, 45], [100, 90]] } });
// name tag swings about its strap hole (CSS pg-tag-swing / pg-tag-swing-lg)
const tagSwing = { dur: 2.8, iter: Infinity, ease: EZ.io, kf: { r: [[0, 0], [30, 7], [70, -7], [100, 0]] } };
const tagSwingLg = { dur: .6, iter: Infinity, ease: EZ.io, kf: { r: [[0, 0], [25, 14], [75, -14], [100, 0]] } };
const SMILE = (mouth, beak) => [['eyes', { o: 0 }], ['eyesHappy', { o: 1 }], ['mouth', { s: mouth }], ['beak', { ty: beak }]];

// state = { len (s), loop?, T0 (loop window start), P (loop period), items: [[target, staticComps, anim?]] }
export const ONE_SHOT = { wave: 2, happy: 1.2, celebrate: 2.6, sad: 2.6, surprised: 1.4, no: 1.2, yes: 1.2, love: 2.4, streak: 2.4 };

export const STATES = {
  idle: { loop: 1, P: 2.8, items: [
    ['body', {}, { dur: 2.8, iter: Infinity, ease: EZ.io, kf: { sx: [[0, 1], [50, .99], [100, 1]], sy: [[0, 1], [50, 1.025], [100, 1]] } }],
    ['wingL', {}, { dur: 2.8, iter: Infinity, ease: EZ.io, kf: { r: [[0, 0], [50, 5], [100, 0]] } }],
    ['wingR', {}, { dur: 2.8, iter: Infinity, ease: EZ.io, kf: { r: [[0, 0], [50, -5], [100, 0]] } }],
    ['tag', {}, tagSwing]] },

  think: { loop: 1, P: 24, items: [
    ['body', {}, { dur: 3, iter: Infinity, ease: EZ.io, kf: { r: [[0, -6], [50, -2], [100, -6]] } }],
    ['pupils', { tx: 4, ty: -5 }],
    ['brows', { o: 1 }], ['browR', { ty: -5, r: -8 }],
    ['wingR', { r: -28 }],
    ['question', { o: 1 }, { dur: 1.6, iter: Infinity, ease: EZ.io, kf: { ty: [[0, 0], [50, -5], [100, 0]], s: [[0, 1], [50, 1.04], [100, 1]] } }]] },

  sleep: { loop: 1, T0: 2, P: 3, items: [
    ['body', {}, { dur: 3, iter: Infinity, ease: EZ.io, kf: { r: [[0, 4], [100, 4]], sx: [[0, 1], [50, 1.03], [100, 1]], sy: [[0, 1], [50, .97], [100, 1]] } }],
    ['eyes', { o: 0 }], ['eyesClosed', { o: 1 }], ['cheeks', { o: .85 }], ['zzz', { o: 1 }],
    ...[0, 1, 2].map(n => ['z' + n, {}, { dur: 3, delay: n, iter: Infinity, ease: EZ.out, fill: 'none', kf: { o: [[0, 0], [25, 1], [100, 0]], tx: [[0, 0], [100, 26]], ty: [[0, 0], [100, -46]], s: [[0, .5], [100, 1.15]] } }])] },

  dance: { loop: 1, T0: .4, P: .8, items: [
    ['root', {}, { dur: .8, iter: Infinity, ease: EZ.io, kf: { tx: [[0, -7], [25, 0], [50, 7], [75, 0], [100, -7]], ty: [[0, 0], [25, -12], [50, 0], [75, -12], [100, 0]], r: [[0, -9], [25, 0], [50, 9], [75, 0], [100, -9]] } }],
    ['wingL', {}, flap(1, .4)], ['wingR', {}, flap(-1, .4, .2)],
    ['footL', {}, step(.8)], ['footR', {}, step(.8, .4)],
    ...SMILE(1, 5)] },

  walk: { loop: 1, T0: .45, P: .9, items: [
    ['root', {}, { dur: .9, iter: Infinity, ease: EZ.io, kf: { r: [[0, -7], [50, 7], [100, -7]] } }],
    ['footL', {}, step(.9)], ['footR', {}, step(.9, .45)],
    ['wingL', {}, flap(1, .45)], ['wingR', {}, flap(-1, .45, .45)]] },

  talk: { loop: 1, P: 291.2, items: [
    ['beak', {}, { dur: .32, iter: Infinity, alt: true, ease: EZ.io, kf: { ty: [[0, 0], [100, 6]] } }],
    ['mouth', {}, { dur: .32, iter: Infinity, alt: true, ease: EZ.io, kf: { s: [[0, 0], [100, 1]] } }],
    ['body', {}, { dur: 1.3, iter: Infinity, ease: EZ.io, kf: { sx: [[0, 1], [50, .99], [100, 1]], sy: [[0, 1], [50, 1.025], [100, 1]] } }],
    ['wingR', {}, { dur: 1.3, iter: Infinity, ease: EZ.io, kf: { r: [[0, 0], [40, -40], [60, -40], [100, 0]] } }],
    ['tag', {}, tagSwing]] },

  wave: { items: [
    ['wingR', {}, { dur: 2, ease: EZ.io, fill: 'both', kf: { r: [[0, 0], [15, -145], [28, -112], [41, -150], [54, -112], [67, -150], [82, -120], [100, 0]] } }],
    ['body', {}, { dur: 2, ease: EZ.io, fill: 'both', kf: { r: [[0, 0], [15, -5], [82, -5], [100, 0]] } }],
    ['mouth', {}, { dur: 2, ease: EZ.io, fill: 'both', kf: { s: [[0, 0], [15, 1], [80, 1], [100, 0]] } }],
    ['beak', {}, { dur: 2, ease: EZ.io, fill: 'both', kf: { ty: [[0, 0], [15, 5], [80, 5], [100, 0]] } }]] },

  happy: { items: [
    ['root', {}, jump(2, .6)], ['shadow', {}, shadowJump(2, .6)],
    ['wingL', {}, flap(1, .3, 0, 4, 'both')], ['wingR', {}, flap(-1, .3, 0, 4, 'both')],
    ...SMILE(1, 5), ['tag', {}, tagSwingLg], ['sparkles', { o: 1 }],
    ...[0, .15, .3, .45].map((d, n) => ['sparkle' + n, {}, twinkle(d)])] },

  celebrate: { items: [
    ['root', {}, jump(4, .65)], ['shadow', {}, shadowJump(4, .65)],
    ['wingL', {}, cheer(1, .3)], ['wingR', {}, cheer(-1, .3)],
    ...SMILE(1.1, 6), ['tag', {}, tagSwingLg], ['cheeks', { o: .9 }], ['confettis', { o: 1 }], ['sparkles', { o: 1 }],
    ...CONF.map((p, n) => ['conf' + n, {}, { dur: 2.2, delay: p.d, ease: EZ.conf, fill: 'both', kf: { o: [[0, 0], [8, 1], [100, 0]], tx: [[0, 0], [100, p.tx]], ty: [[0, 0], [100, 250]], r: [[0, 0], [100, p.r]] } }]),
    ...[0, .15, .3, .45].map((d, n) => ['sparkle' + n, {}, twinkle(d + .3, 2, 1.1)])] },

  sad: { items: [
    ['body', {}, { dur: 2.6, ease: EZ.io, fill: 'both', kf: { sx: [[0, 1], [20, 1.04], [80, 1.04], [100, 1]], sy: [[0, 1], [20, .93], [80, .93], [100, 1]], r: [[0, 0], [20, 1.789], [80, 1.789], [100, 0]] } }],
    ['wingL', {}, { dur: 2.6, ease: EZ.io, fill: 'both', kf: { r: [[0, 0], [20, -12], [80, -12], [100, 0]] } }],
    ['wingR', {}, { dur: 2.6, ease: EZ.io, fill: 'both', kf: { r: [[0, 0], [20, 12], [80, 12], [100, 0]] } }],
    ['pupils', { ty: 4, s: .92 }], ['brows', { o: 1 }], ['browL', { ty: 2, r: -16 }], ['browR', { ty: 2, r: 16 }],
    ['tear', {}, { dur: 1.3, delay: .3, iter: 2, ease: EZ.in, fill: 'both', kf: { o: [[0, 0], [20, 1], [100, 0]], ty: [[0, 0], [20, 0], [100, 40]], s: [[0, .6], [20, 1], [100, 1]] } }]] },

  surprised: { items: [
    ['root', {}, { dur: 1.4, ease: EZ.out, fill: 'both', kf: { ty: [[0, 0], [12, -22], [30, 0], [45, 0], [60, 0], [100, 0]], sx: [[0, 1], [12, 1.06], [30, 1.05], [45, .98], [60, 1], [100, 1]], sy: [[0, 1], [12, .96], [30, .93], [45, 1.03], [60, 1], [100, 1]] } }],
    ['pupils', {}, { dur: 1.4, ease: EZ.out, fill: 'both', kf: { s: [[0, 1], [12, 1.25], [75, 1.25], [100, 1]] } }],
    ['brows', { o: 1 }], ['browL', { ty: -8 }], ['browR', { ty: -8 }],
    ['mouth', { s: 1.2 }], ['beak', { ty: 7 }],
    ['wingL', {}, { dur: 1.4, ease: EZ.out, fill: 'both', kf: { r: [[0, 0], [12, 60], [70, 60], [100, 0]] } }],
    ['wingR', {}, { dur: 1.4, ease: EZ.out, fill: 'both', kf: { r: [[0, 0], [12, -60], [70, -60], [100, 0]] } }],
    ['exclaim', {}, { dur: 1.4, ease: EZ.out, fill: 'both', kf: { o: [[0, 0], [15, 1], [25, 1], [75, 1], [100, 0]], s: [[0, 0], [15, 1.3], [25, 1], [75, 1], [100, 1]] } }],
    ['sweat', {}, { dur: 1.4, delay: .2, ease: EZ.in, fill: 'both', kf: { o: [[0, 0], [20, 1], [100, 0]], ty: [[0, 0], [100, 22]] } }]] },

  no: { items: [
    ['face', {}, { dur: 1.2, ease: EZ.io, fill: 'both', kf: { tx: [[0, 0], [14, -8], [32, 8], [50, -8], [68, 8], [84, 0], [100, 0]] } }],
    ['body', {}, { dur: 1.2, ease: EZ.io, fill: 'both', kf: { r: [[0, 0], [14, -2], [32, 2], [50, -2], [68, 2], [84, 0], [100, 0]] } }],
    ['brows', { o: 1 }], ['browL', { r: 10 }], ['browR', { r: -10 }]] },

  yes: { items: [
    ['face', {}, { dur: 1.2, ease: EZ.io, fill: 'both', kf: { ty: [[0, 0], [15, 8], [30, 0], [45, 8], [60, 0], [100, 0]] } }],
    ['body', {}, { dur: 1.2, ease: EZ.io, fill: 'both', kf: { sx: [[0, 1], [15, 1.02], [30, 1], [45, 1.02], [60, 1], [100, 1]], sy: [[0, 1], [15, .97], [30, 1], [45, .97], [60, 1], [100, 1]] } }],
    ['cheeks', { o: .85 }], ['tag', {}, tagSwingLg]] },

  love: { items: [
    ['body', {}, { dur: 1.2, iter: 2, ease: EZ.io, fill: 'both', kf: { r: [[0, 0], [25, -4], [75, 4], [100, 0]] } }],
    ['eyes', { o: 0 }], ['eyesHeart', { o: 1 }], ['heartPulse', {}, { dur: .6, iter: Infinity, ease: EZ.io, kf: { s: [[0, 1], [50, 1.18], [100, 1]] } }],
    ['cheeks', {}, { dur: 1.2, iter: 2, ease: EZ.io, fill: 'both', kf: { o: [[0, .55], [50, 1], [100, .55]], s: [[0, 1], [50, 1.35], [100, 1]] } }],
    ['hearts', { o: 1 }],
    ...[0, .4, .8, 1.1].map((d, n) => ['heart' + n, {}, { dur: 1.6, delay: d, ease: EZ.out, fill: 'both', kf: { o: [[0, 0], [20, 1], [100, 0]], ty: [[0, 0], [20, -8], [100, -50]], s: [[0, .3], [20, 1], [100, 1.1]] } }]),
    ['wingL', { r: -14 }], ['wingR', { r: 14 }], ['tag', {}, tagSwingLg]] },

  streak: { items: [
    ['flame', {}, { dur: 2.4, ease: EZ.out, fill: 'both', kf: { sx: [[0, 0], [20, 1.12], [30, 1], [45, 1.04], [60, .98], [80, 1], [100, 0]], sy: [[0, 0], [20, 1.18], [30, 1], [45, .97], [60, 1.04], [80, 1], [100, 0]] } }],
    ['root', {}, jump(2, .6, .3)],
    ['wingL', {}, cheer(1, .3)], ['wingR', {}, cheer(-1, .3)],
    ...SMILE(1, 5)] }
};

// independent infinite blink (CSS: .pg-eye{animation:pg-blink 4.2s infinite}, default timing "ease")
export const BLINK = { len: 4.2, items: [['blink', {}, { dur: 4.2, iter: Infinity, ease: EZ.ease, kf: { sy: [[0, 1], [92, 1], [95, .08], [100, 1]] } }]] };
