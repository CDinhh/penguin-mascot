// Kiểm tra spec/mascot.json hợp lệ và khớp với danh sách trạng thái trong penguin.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = new URL('../', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('spec/mascot.json', root), 'utf8'));
const P = createRequire(import.meta.url)('../packages/web/penguin.js');

test('spec có tên và variant hợp lệ', () => {
  assert.equal(spec.name, 'BipBip');
  assert.deepEqual(spec.variants, ['plush']);
  assert.equal(spec.defaultVariant, 'plush');
  assert.deepEqual(Object.keys(spec.rive.artboards), spec.variants);
});

test('mỗi trạng thái có loop, durationMs và riveInput hợp lệ', () => {
  const moods = [];
  for (const [name, s] of Object.entries(spec.states)) {
    assert.equal(typeof s.loop, 'boolean', name);
    assert.ok(Number.isInteger(s.durationMs) && s.durationMs > 0, name);
    if (s.loop) {
      assert.deepEqual({ type: s.riveInput.type, name: s.riveInput.name }, { type: 'number', name: 'mood' }, name);
      moods.push(s.riveInput.value);
    } else {
      assert.deepEqual(s.riveInput, { type: 'trigger', name }, name);
    }
  }
  assert.deepEqual(moods.sort((a, b) => a - b), moods.map((_, i) => i), 'mood phải là 0..n-1, không trùng');
});

test('trạng thái trong penguin.js khớp spec (tên, loop, thời lượng)', () => {
  assert.deepEqual([...P.STATES].sort(), Object.keys(spec.states).sort());
  for (const name of P.LOOPING) assert.equal(spec.states[name].loop, true, name);
  for (const [name, ms] of Object.entries(P.ONE_SHOT)) {
    assert.equal(spec.states[name].loop, false, name);
    assert.equal(spec.states[name].durationMs, ms, name);
  }
});

test('penguin.js chỉ có variant plush', () => {
  assert.deepEqual(Object.keys(P.VARIANTS), spec.variants);
});
