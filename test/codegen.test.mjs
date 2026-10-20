// File sinh ra từ spec phải khớp spec (không ai sửa tay).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../tools/codegen.mjs';

for (const [rel, content] of Object.entries(generate())) {
  test(`${rel} khớp spec`, () => {
    assert.equal(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'), content, 'chạy npm run codegen');
  });
}
