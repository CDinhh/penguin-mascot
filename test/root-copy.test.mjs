// Bản chép ở thư mục gốc (giữ link cũ) phải giống packages/web.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COPIED } from '../tools/sync-root.mjs';

for (const f of COPIED) {
  test(`${f} ở gốc giống packages/web/${f}`, () => {
    assert.equal(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'),
      readFileSync(new URL(`../packages/web/${f}`, import.meta.url), 'utf8'), 'chạy npm run sync:root');
  });
}
