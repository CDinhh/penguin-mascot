// RiveDriver với Rive giả: ánh xạ trạng thái -> property của view model theo spec, chờ state machine về state lặp, phát lại, lỗi nạp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RiveDriver } from '../packages/web-rive/src/driver.js';
import { SPEC } from '../packages/web-rive/src/spec.generated.js';

const EventType = { StateChange: 'statechange' };

function fakeRive({ inputs, fail, noViewModel } = {}) {
  const made = {};
  class Rive {
    constructor(opts) {
      made.opts = opts; made.rive = this; made.handlers = {}; made.paused = 0; made.played = 0; made.cleaned = 0;
      const wanted = new Map(Object.values(SPEC.states).map((s) => [s.riveInput.name, s.riveInput.type]));
      const names = inputs || [...wanted.keys()];
      made.inputs = Object.fromEntries(names.map((name) => [name, { value: undefined, fired: 0, trigger() { this.fired++; } }]));
      made.cap = { value: undefined };
      const pick = (type) => (n) => (wanted.get(n) === type ? made.inputs[n] ?? null : null);
      this.viewModelInstance = noViewModel ? null : { number: pick('number'), trigger: pick('trigger'), boolean: (n) => (n === SPEC.rive.capInput.name ? made.cap : null) };
      setTimeout(() => (fail ? opts.onLoadError(new Error('404')) : opts.onLoad()), 0);
    }
    on(t, cb) { made.handlers[t] = cb; }
    off(t) { delete made.handlers[t]; }
    pause() { made.paused++; }
    play() { made.played++; }
    cleanup() { made.cleaned++; }
    resizeDrawingSurfaceToCanvas() {}
  }
  return { Rive, made };
}
const tick = () => new Promise((r) => setTimeout(r, 5));
const make = (o) => {
  const { Rive, made } = fakeRive(o);
  const errors = [];
  const d = new RiveDriver({ Rive, EventType, canvas: {}, src: 'x.riv', onError: (e) => errors.push(e) });
  return { d, made, errors };
};
const state = (made, names) => made.handlers[EventType.StateChange]({ data: names });

test('nạp đúng artboard và state machine theo spec, tự gắn view model', async () => {
  const { made } = make();
  assert.equal(made.opts.artboard, 'BipBip Plush');
  assert.equal(made.opts.stateMachine, 'Main');
  assert.equal(made.opts.autoBind, true);
});

test('trạng thái lặp đặt mood theo spec, trước và sau khi nạp xong', async () => {
  const { d, made } = make();
  await d.play('dance'); // chưa nạp xong: nhớ lại để áp dụng sau
  await tick();
  assert.equal(made.inputs.mood.value, SPEC.states.dance.riveInput.value);
  await d.play('sleep');
  assert.equal(made.inputs.mood.value, SPEC.states.sleep.riveInput.value);
});

test('trạng thái một lần bắn trigger và resolve khi state machine về state lặp', async () => {
  const { d, made } = make();
  await tick();
  let done = false;
  const p = d.play('happy').then(() => { done = true; });
  assert.equal(made.inputs.happy.fired, 1);
  await tick();
  assert.equal(done, false);
  state(made, ['idle']); // chưa vào state của trạng thái nên chưa tính là xong
  await tick();
  assert.equal(done, false, 'state lặp đến trước khi bắt đầu không làm xong');
  state(made, ['happy']);
  await tick();
  assert.equal(done, false, 'đang chạy chưa xong');
  state(made, ['blink']);
  await tick();
  assert.equal(done, false, 'state khác không làm xong');
  state(made, ['idle']);
  await p;
  assert.equal(done, true);
});

test('mọi state lặp trong spec.rive.doneStates đều báo xong', async () => {
  for (const name of SPEC.rive.doneStates) {
    const { d, made } = make();
    await tick();
    const p = d.play('sad');
    state(made, ['sad']);
    state(made, [name]);
    await p;
  }
});

test('chạy lại cùng trạng thái bắn trigger lần nữa và resolve lượt trước', async () => {
  const { d, made } = make();
  await tick();
  const first = d.play('sad');
  const second = d.play('sad');
  await first; // bị lượt sau thay thế nên resolve ngay
  assert.equal(made.inputs.sad.fired, 2);
  state(made, ['sad']);
  state(made, ['idle']);
  await second;
});

test('không nhận được thay đổi state thì resolve sau durationMs + dư', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { d } = make();
  t.mock.timers.tick(1);
  let done = false;
  d.play('wave').then(() => { done = true; });
  t.mock.timers.tick(SPEC.states.wave.durationMs);
  await Promise.resolve();
  assert.equal(done, false);
  t.mock.timers.tick(700);
  await Promise.resolve();
  assert.equal(done, true);
});

test('giảm chuyển động: không bắn trigger nhưng vẫn resolve', async () => {
  const { d, made } = make();
  await tick();
  await d.play('love', { reduceMotion: true });
  assert.equal(made.inputs.love.fired, 0);
});

test('mũ tốt nghiệp: mặc định không đội, đổi được trước và sau khi nạp', async () => {
  const { d, made } = make();
  d.setCap(true); // chưa nạp xong: nhớ lại để áp dụng sau
  await tick();
  assert.equal(made.cap.value, true);
  d.setCap(false);
  assert.equal(made.cap.value, false);
  const other = make();
  await tick();
  assert.equal(other.made.cap.value, false, 'mặc định không mũ để khớp web component');
});

test('tạm dừng và chạy lại, hủy gọi cleanup', async () => {
  const { d, made } = make();
  await tick();
  d.setPaused(true);
  d.setPaused(true);
  d.setPaused(false);
  assert.deepEqual([made.paused, made.played], [1, 1]);
  d.destroy();
  d.destroy();
  assert.equal(made.cleaned, 1);
});

test('lỗi nạp file gọi onError một lần và hủy', async () => {
  const { Rive } = fakeRive({ fail: true });
  const errors = [];
  const d = new RiveDriver({ Rive, EventType, canvas: {}, src: 'missing.riv', onError: (e) => errors.push(e) });
  await tick();
  assert.equal(errors.length, 1);
  assert.equal(d.destroyed, true);
  await d.play('happy'); // không ném lỗi
});

test('file thiếu input theo spec bị coi là lỗi', async () => {
  const { d, errors } = make({ inputs: ['mood'] });
  await tick();
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /wave|happy/);
  assert.equal(d.destroyed, true);
});

test('file không gắn view model bị coi là lỗi', async () => {
  const { d, errors } = make({ noViewModel: true });
  await tick();
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /view model/);
  assert.equal(d.destroyed, true);
});

test('variant không có trong spec bị từ chối', () => {
  const { Rive } = fakeRive();
  assert.throws(() => new RiveDriver({ Rive, EventType, canvas: {}, src: 'x', variant: 'classic' }), /classic/);
});
