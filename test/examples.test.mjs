// Ví dụ React và web + Rive: build bằng Vite rồi mở trong Chrome. Chưa có bipbip.riv nên phải lùi về SVG/web component
// (kiểm chứng đường lùi với runtime Rive thật). Cần Chrome và `npm install` (Vite).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dumpDom, serve, skipNoChrome } from './helpers.mjs';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const hasVite = existsSync(`${root}node_modules/vite`);
const skip = skipNoChrome || (!hasVite && 'chưa cài Vite (chạy npm install)');
const rivePresent = existsSync(`${root}rive/bipbip.riv`);

for (const [name, mode] of [['react', 'web component'], ['web-rive', 'SVG']]) {
  test(`ví dụ ${name} lùi về ${mode} khi chưa có bipbip.riv`, { skip: skip || (rivePresent && 'đã có bipbip.riv, đường lùi không áp dụng'), timeout: 180000 }, async () => {
    const dir = `${root}examples/${name}`;
    await execFileAsync('npx', ['vite', 'build'], { cwd: dir });
    const s = await serve(`${dir}/dist`);
    try {
      const dom = await dumpDom(s.url, { budgetMs: 15000 });
      assert.match(dom, new RegExp(`Renderer: ${mode} \\(không nạp được rive/bipbip.riv\\)`));
      assert.match(dom, /<penguin-mascot/);
      assert.doesNotMatch(dom, /<canvas/, 'không còn canvas Rive');
    } finally {
      s.close();
    }
  });
}
