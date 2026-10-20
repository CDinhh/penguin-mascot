// Tìm Chrome/Chromium trên máy. Thứ tự: đường dẫn truyền vào, biến CHROME, vị trí cài mặc định, Playwright.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function findChrome(explicit) {
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH;
  const playwright = pw && existsSync(pw)
    ? readdirSync(pw).filter((d) => d.startsWith('chromium-')).map((d) => join(pw, d, 'chrome-linux', 'chrome'))
    : [];
  return [
    explicit,
    process.env.CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    ...playwright,
  ].find((p) => p && existsSync(p));
}

/** Chạy root trong container thì Chrome bắt buộc có --no-sandbox. */
export const sandboxFlags = () => (process.getuid?.() === 0 ? ['--no-sandbox'] : []);
