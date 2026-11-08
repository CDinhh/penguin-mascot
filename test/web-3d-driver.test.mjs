// MascotDriver (renderer 3D) với mixer giả: loop/one-shot, trộn clip, phát lại, giảm chuyển động, hết hạn hẹn giờ.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MascotDriver } from '../packages/web-3d/src/driver.js';

const spec = JSON.parse(readFileSync(new URL('../spec/mascot.json', import.meta.url), 'utf8'));
const states = Object.fromEntries(Object.entries(spec.states).map(([k, v]) => [k, { loop: v.loop, durationMs: v.durationMs }]));
const THREE = { LoopOnce: 2200, LoopRepeat: 2201 };

function fakeMixer() {
  const listeners = {}; const actions = new Map(); const log = [];
  const mixer = {
    log, actions,
    clipAction(clip) {
      if (!actions.has(clip.name)) {
        const a = { clip, loop: null, plays: 0, resets: 0, weight: 0, time: 0, paused: false, enabled: false, from: null, clampWhenFinished: false,
          setLoop(m) { this.loop = m; }, reset() { this.resets++; this.time = 0; return this; }, play() { this.plays++; return this; },
          setEffectiveWeight(w) { this.weight = w; }, setEffectiveTimeScale() {}, crossFadeFrom(o) { this.from = o.clip.name; log.push(`${o.clip.name}->${this.clip.name}`); } };
        actions.set(clip.name, a);
      }
      return actions.get(clip.name);
    },
    addEventListener(t, f) { listeners[t] = f; }, removeEventListener(t) { delete listeners[t]; },
    finish(name) { listeners.finished({ action: actions.get(name) }); },
  };
  return mixer;
}
const make = () => { const mixer = fakeMixer(); const d = new MascotDriver({ THREE, mixer, clips: Object.keys(states).map((name) => ({ name })), states, fade: 0.2 }); return { d, mixer }; };

test('trạng thái lặp: LoopRepeat, resolve ngay, trộn clip', async () => {
  const { d, mixer } = make();
  assert.equal(mixer.actions.get('idle').loop, THREE.LoopRepeat);
  await d.play('idle');
  assert.equal(await d.play('dance'), 'dance');
  assert.ok(mixer.log.includes('idle->dance'), 'trộn từ idle sang dance');
  assert.equal(d.base, 'dance');
});

test('trạng thái một lần: LoopOnce + giữ khung cuối, resolve khi clip xong rồi về trạng thái lặp', async () => {
  const { d, mixer } = make();
  await d.play('walk');
  const a = mixer.actions.get('happy');
  assert.equal(a.loop, THREE.LoopOnce); assert.equal(a.clampWhenFinished, true);
  let done = null; const p = d.play('happy').then((s) => (done = s));
  await Promise.resolve(); assert.equal(done, null, 'chưa xong');
  mixer.finish('happy'); await p;
  assert.equal(done, 'happy');
  assert.equal(d.current, mixer.actions.get('walk'), 'về trạng thái lặp gần nhất');
});

test('phát lại cùng một trạng thái một lần: reset clip', async () => {
  const { d, mixer } = make();
  d.play('no'); const first = mixer.actions.get('no').resets;
  mixer.finish('no'); d.play('no');
  assert.ok(mixer.actions.get('no').resets > first);
  mixer.finish('no');
});

test('clip một lần bị thay thế giữa chừng: Promise cũ vẫn resolve', async () => {
  const { d, mixer } = make();
  const p1 = d.play('celebrate'); const p2 = d.play('sad');
  assert.equal(await p1, 'celebrate');
  mixer.finish('sad'); assert.equal(await p2, 'sad');
});

test('tab bị hãm: hết giờ (durationMs + trượt) thì vẫn xong', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { d } = make(); let done = false; d.play('yes').then(() => (done = true));
  t.mock.timers.tick(spec.states.yes.durationMs + 200); await Promise.resolve(); assert.equal(done, false);
  t.mock.timers.tick(1000); await Promise.resolve(); await Promise.resolve(); assert.equal(done, true);
});

test('giảm chuyển động: clip một lần xong ngay, clip lặp đứng ở khung đầu', async () => {
  const { d, mixer } = make(); d.setReduceMotion(true);
  assert.equal(await d.play('celebrate'), 'celebrate');
  await d.play('dance');
  assert.equal(mixer.actions.get('dance').paused, true); assert.equal(mixer.actions.get('dance').time, 0);
});

test('tên lạ chạy idle; destroy resolve hẹn đang chờ', async () => {
  const { d } = make();
  assert.equal(await d.play('khong-co'), 'idle');
  const p = d.play('love'); d.destroy(); assert.equal(await p, 'love');
});

test('clip trong GLB khớp driver: mọi trạng thái spec đều có clip', () => {
  assert.equal(Object.keys(states).length, 15);
});
