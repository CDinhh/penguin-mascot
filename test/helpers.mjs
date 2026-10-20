// Chạy trang thử trong Chrome headless (không thư viện): lấy JSON trang ghi vào <pre id="out"> hoặc lấy DOM cuối.
import http from 'node:http';
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { promisify } from 'node:util';
import { findChrome, sandboxFlags } from '../tools/chrome.mjs';

const execFileAsync = promisify(execFile);

export const chrome = findChrome();
export const skipNoChrome = !chrome && 'không tìm thấy Chrome (đặt biến CHROME)';

const args = (profile, target, budgetMs) => ['--headless=new', '--disable-gpu', '--disable-background-networking', ...sandboxFlags(),
  `--user-data-dir=${profile}`, `--virtual-time-budget=${budgetMs}`, '--dump-dom', target];

/** DOM sau khi trang chạy xong (virtual time). Bất đồng bộ để máy chủ trong cùng tiến trình vẫn trả lời được. */
export async function dumpDom(target, { budgetMs = 8000 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'pg-test-'));
  try {
    return (await execFileAsync(chrome, args(profile, target, budgetMs), { encoding: 'utf8', timeout: 90000 })).stdout;
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

/** Mở file HTML, trả về JSON mà trang ghi vào <pre id="out">. */
export function runPage(file, { budgetMs = 8000 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'pg-test-'));
  let dom;
  try {
    dom = execFileSync(chrome, args(profile, `file://${file}`, budgetMs), { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] });
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
  const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('Trang không ghi kết quả vào #out');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}

/** Máy chủ tĩnh tối giản cho thư mục `dir` (module script không chạy được từ file://). */
export async function serve(dir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.riv': 'application/octet-stream' };
  const server = http.createServer((req, res) => {
    let p = join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() };
}
