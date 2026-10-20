// Mở Chrome headless và điều khiển qua CDP (WebSocket có sẵn trong Node 22, không cần thư viện).
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findChrome, sandboxFlags } from './chrome.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{ chrome?: string, width: number, height: number, deviceScaleFactor?: number }} opts
 * @returns {Promise<{ cdp: Function, evalJs: (expr: string) => Promise<any>, navigate: (url: string) => Promise<void>, close: () => void }>}
 */
export async function launch({ chrome, width, height, deviceScaleFactor = 1 }) {
  const bin = findChrome(chrome);
  if (!bin) throw new Error('Không tìm thấy Chrome, truyền --chrome <đường dẫn> hoặc đặt biến CHROME.');
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'pg-cdp-'));
  const proc = spawn(bin, ['--headless=new', '--disable-gpu', '--hide-scrollbars', ...sandboxFlags(),
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

  const close = () => {
    proc.kill();
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  };

  try {
    let targets;
    for (let i = 0; i < 100 && !targets; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(100); }
    }
    if (!targets) throw new Error('Không kết nối được Chrome');
    const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    };
    const cdp = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
    const evalJs = async (expression) => {
      const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'Lỗi JS trong trang');
      return r.result.value;
    };
    await cdp('Page.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile: false });
    await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const navigate = async (url) => { await cdp('Page.navigate', { url }); await sleep(500); };
    return { cdp, evalJs, navigate, close: () => { try { ws.close(); } catch {} close(); } };
  } catch (e) {
    close();
    throw e;
  }
}
