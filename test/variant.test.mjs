// Kiểm tra thuộc tính variant viết sẵn trong HTML được đọc đúng (cần Chrome, chạy headless).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome, sandboxFlags } from '../tools/chrome.mjs';

const chrome = findChrome();
const page = fileURLToPath(new URL('fixtures/variant.html', import.meta.url));

test('variant trong HTML được đọc đúng', { skip: !chrome && 'không tìm thấy Chrome (đặt biến CHROME)' }, () => {
  const profile = mkdtempSync(join(tmpdir(), 'pg-test-'));
  try {
    const dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', ...sandboxFlags(), `--user-data-dir=${profile}`,
      '--virtual-time-budget=2000', '--dump-dom', `file://${page}`], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
    const out = JSON.parse(dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    assert.deepEqual(out.plush, { variant: 'plush', test: false, plush: true });
    assert.deepEqual(out.test, { variant: 'test', test: true, plush: false });
    assert.deepEqual(out.none, { variant: 'plush', test: false, plush: true });
    assert.deepEqual(out.unknown, { variant: 'plush', test: false, plush: true });
    assert.deepEqual(out.dynamic, { variant: 'test', test: true });
    assert.equal(out.states.length, 15);
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
});
