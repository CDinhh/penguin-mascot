// Xuất lớp bộ phận cho Rive: ghép lại phải trùng hình gốc, và art/plush đã commit phải đủ bộ phận (cần Chrome).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findChrome } from '../tools/chrome.mjs';
import { exportLayers } from '../tools/export-layers.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('art/plush đủ bộ phận và file tồn tại', () => {
  const parts = JSON.parse(read('art/plush/parts.json'));
  assert.deepEqual(parts.artboard, { width: 200, height: 240 });
  const names = parts.parts.map((p) => p.name);
  for (const n of ['shadow', 'body', 'head', 'eye_l', 'eye_r', 'wing_l', 'wing_r', 'foot_l', 'foot_r', 'beak_top', 'beak_bot']) {
    assert.ok(names.includes(n), `thiếu ${n}`);
  }
  for (const p of parts.parts) assert.ok(existsSync(new URL(`art/plush/${p.file}`, root)), p.file);
  for (const f of parts.fx) assert.ok(existsSync(new URL(`art/plush/${f.file}`, root)), f.file);
});

test('rive/README.md nhắc đủ trạng thái và input trong spec', () => {
  const spec = JSON.parse(read('spec/mascot.json'));
  const md = read('rive/README.md');
  for (const name of Object.keys(spec.states)) assert.ok(md.includes(`\`${name}\``), name);
  for (const i of spec.rive.extraInputs) assert.ok(md.includes(`\`${i.name}\``), i.name);
  assert.ok(md.includes(spec.rive.artboards.plush) && md.includes(spec.rive.stateMachine) && md.includes(spec.rive.doneEvent));
});

test('ghép các lớp lại trùng hình gốc', { skip: !findChrome() && 'không tìm thấy Chrome (đặt biến CHROME)', timeout: 120000 }, async () => {
  const out = mkdtempSync(join(tmpdir(), 'pg-layers-'));
  try {
    const r = await exportLayers({ out, verify: true });
    assert.ok(r.verify.mean < 0.5, `sai khác trung bình ${r.verify.mean}`);
    assert.ok(r.verify.badPixels < 50, `${r.verify.badPixels} điểm lệch`);
    assert.deepEqual(r.parts.map((p) => p.name), JSON.parse(read('art/plush/parts.json')).parts.map((p) => p.name));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
