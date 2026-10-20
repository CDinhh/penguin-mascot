// Giao thức registerRenderer của web component: gắn renderer ngoài, phát lại, lùi về SVG khi lỗi (cần Chrome).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runPage, skipNoChrome } from './helpers.mjs';

test('registerRenderer', { skip: skipNoChrome, timeout: 120000 }, () => {
  const o = runPage(fileURLToPath(new URL('fixtures/renderer.html', import.meta.url)));
  assert.deepEqual(o.parsed.a, { canvas: true, svg: false }, 'renderer="fake" viết sẵn trong HTML dùng renderer');
  assert.deepEqual(o.parsed.b, { canvas: false, svg: true }, 'renderer chưa đăng ký thì dùng SVG');
  assert.equal(o.oneShot.resolved, 'happy');
  assert.deepEqual(o.oneShot.events, ['state:think', 'state:happy', 'done:happy', 'state:think']);
  assert.equal(o.oneShot.state, 'think');
  assert.equal(o.replay, 2, 'chạy lại cùng trạng thái gọi lại renderer');
  assert.deepEqual(o.toSvg, { log: ['destroy'], canvas: false, svg: true });
  assert.deepEqual(o.throwFallback, { canvas: false, svg: true, events: ['fake'] });
  assert.deepEqual(o.asyncFallback.before, { canvas: true, svg: false });
  assert.deepEqual(o.asyncFallback.after, { canvas: false, svg: true });
  assert.deepEqual(o.asyncFallback.events, ['fake']);
  assert.equal(o.asyncFallback.resolved, 'sad');
  assert.equal(o.asyncFallback.state, 'idle');
});
