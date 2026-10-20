// Kiểm tra thuộc tính variant viết sẵn trong HTML được đọc đúng (cần Chrome, chạy headless).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runPage, skipNoChrome } from './helpers.mjs';

test('variant trong HTML được đọc đúng', { skip: skipNoChrome }, () => {
  const out = runPage(fileURLToPath(new URL('fixtures/variant.html', import.meta.url)), { budgetMs: 2000 });
  assert.deepEqual(out.plush, { variant: 'plush', test: false, plush: true });
  assert.deepEqual(out.test, { variant: 'test', test: true, plush: false });
  assert.deepEqual(out.none, { variant: 'plush', test: false, plush: true });
  assert.deepEqual(out.unknown, { variant: 'plush', test: false, plush: true });
  assert.deepEqual(out.dynamic, { variant: 'test', test: true });
  assert.equal(out.states.length, 15);
});
