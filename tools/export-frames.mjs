// Xuất animation của linh vật thành sprite sheet (WebP trong suốt) + manifest.json,
// để dùng trong app native / Flutter mà không cần trình duyệt.
//
//   node tools/export-frames.mjs --variant plush --out export/plush
//   node tools/export-frames.mjs --states idle,wave,happy --fps 15 --size 256x320
//
// Cần Chrome và Node 22+ (dùng WebSocket có sẵn). Không cần cài thư viện nào.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Trạng thái, thời lượng và kiểu lặp lấy từ spec/mascot.json (nguồn sự thật duy nhất). Trạng thái lặp là một chu kỳ
// đủ dài để mọi chuyển động (thở, chớp mắt, vẫy cánh) lặp nguyên số lần và khớp đuôi với đầu.
const spec = JSON.parse(readFileSync(join(root, 'spec', 'mascot.json'), 'utf8'));
const all = Object.fromEntries(Object.entries(spec.states).map(([k, v]) => [k, { ms: v.durationMs, loop: v.loop }]));

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
    return acc;
  }, []),
);

const variant = args.variant || spec.defaultVariant;
const out = resolve(args.out || join(root, 'export', variant));
const fps = Number(args.fps || 15);
const [W, H] = (args.size || '256x320').split('x').map(Number);
const cols = Number(args.cols || 8);
const quality = Number(args.quality || 0.8);
const chrome = args.chrome;

const states = (args.states ? args.states.split(',') : Object.keys(all));
for (const s of states) if (!all[s]) throw new Error(`Không có animation "${s}". Có: ${Object.keys(all).join(', ')}`);

const { cdp, evalJs, navigate, close } = await launch({ chrome, width: W, height: H });

try {
  await navigate(pathToFileURL(join(root, 'tools', 'frame-page.html')).href);
  await evalJs(`customElements.whenDefined('penguin-mascot')`);

  mkdirSync(out, { recursive: true });
  const manifest = { variant, frameWidth: W, frameHeight: H, fps, columns: cols, states: {} };
  // Linh vật chiếm khoảng 88% bề rộng khung, chừa chỗ cho pháo giấy, tim, Zzz bay ra ngoài.
  await evalJs(`fit(${Math.round(W * 0.88)})`);

  for (const state of states) {
    const { ms, loop } = all[state];
    await evalJs(`setup(${JSON.stringify(variant)}, ${JSON.stringify(state)}, ${loop ? ms : 0})`);
    const count = Math.round((ms / 1000) * fps);
    const urls = [];
    for (let i = 0; i < count; i++) {
      await evalJs(`seek(${(i * ms) / count})`);
      const shot = await cdp('Page.captureScreenshot', { format: 'webp', quality: Math.round(quality * 100), fromSurface: true });
      urls.push(`data:image/webp;base64,${shot.data}`);
    }
    const sheet = await evalJs(`sheet(${JSON.stringify(urls)}, ${cols}, ${W}, ${H}, 'image/webp', ${quality})`);
    const file = `${state}.webp`;
    writeFileSync(join(out, file), Buffer.from(sheet.split(',')[1], 'base64'));
    manifest.states[state] = { file, frames: count, durationMs: ms, loop };
    console.log(`${state}: ${count} khung, ${ms}ms${loop ? ' (lặp)' : ''}`);
  }

  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Xong: ${out}`);
} finally {
  close();
}
