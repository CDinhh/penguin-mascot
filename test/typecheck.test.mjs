// Gói React và ví dụ phải qua tsc --strict (cần `npm install`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const tsc = `${root}node_modules/typescript/bin/tsc`;

for (const dir of ['packages/react', 'examples/react']) {
  test(`tsc ${dir}`, { skip: !existsSync(tsc) && 'chưa cài TypeScript (chạy npm install)', timeout: 120000 }, async () => {
    await assert.doesNotReject(run(process.execPath, [tsc, '-p', `${root}${dir}`]).catch((e) => { throw new Error(e.stdout || e.message); }));
  });
}
