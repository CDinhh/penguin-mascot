// Tách từng bộ phận của BipBip (bản plush) ra PNG trong suốt ở 3x, để nhập vào Rive editor.
//
//   node tools/export-layers.mjs                 xuất vào art/plush
//   node tools/export-layers.mjs --out /tmp/art  xuất chỗ khác
//   node tools/export-layers.mjs --verify        xuất xong thì ghép lại và so với ảnh gốc
//
// Mỗi bộ phận được chụp riêng (ẩn hết phần còn lại) trên cùng một khung 200x240 cộng lề, rồi cắt theo hộp bao,
// nên vị trí trong parts.json (đơn vị artboard 200x240) ghép lại đúng như hình gốc. Lông đã được nướng vào PNG
// (Rive không có filter feTurbulence). Hiệu ứng (lửa, tim, Zzz, ...) xuất dạng SVG vào fx/.
// Cần Chrome và Node 22+, không cần cài thư viện.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCALE = 3;
const MARGIN_PX = 2; // lề thêm quanh hộp bao, tránh cắt mất viền lông mờ

export const ARTBOARD = { width: 200, height: 240 };

/** Xuất bộ phận vào `out`. Trả về nội dung parts.json (kèm sai khác khi `verify`). */
export async function exportLayers({ out, chrome, verify = false, log = () => {} }) {
  out = resolve(out);
  const pad = 30;
  const { evalJs, cdp, navigate, close } = await launch({
    chrome, width: ARTBOARD.width + pad * 2, height: ARTBOARD.height + pad * 2, deviceScaleFactor: SCALE,
  });
  try {
    await navigate(pathToFileURL(join(root, 'tools', 'layers-page.html')).href);
    const info = await evalJs('prepare()');
    const shot = async () => `data:image/png;base64,${(await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true })).data}`;

    rmSync(out, { recursive: true, force: true });
    mkdirSync(join(out, 'fx'), { recursive: true });

    const parts = [];
    const layers = []; // chỉ các lớp hiện ở tư thế nghỉ, để ghép kiểm tra
    for (const name of info.parts) {
      const meta = await evalJs(`isolate(${JSON.stringify(name)})`);
      const c = await evalJs(`crop(${JSON.stringify(await shot())}, ${MARGIN_PX})`);
      if (!c) throw new Error(`Bộ phận ${name} trống`);
      const file = `${name}.png`;
      writeFileSync(join(out, file), Buffer.from(c.url.split(',')[1], 'base64'));
      // Pixel (đã nhân SCALE, có lề `pad`) -> đơn vị artboard
      const part = {
        name, file,
        x: round(c.x / SCALE - pad), y: round(c.y / SCALE - pad), width: round(c.w / SCALE), height: round(c.h / SCALE),
        pivot: meta.pivot ? meta.pivot.map(round) : null,
        visibleAtRest: meta.rest,
      };
      parts.push(part);
      if (meta.rest) layers.push({ url: c.url, x: c.x, y: c.y });
      log(`${name}: ${c.w}x${c.h}px`);
    }

    await evalJs('showAll()');
    const fx = [];
    for (const name of await evalJs('fxList()')) {
      const file = `fx/${name}.svg`;
      writeFileSync(join(out, file), (await evalJs(`fxSvg(${JSON.stringify(name)})`)) + '\n');
      fx.push({ name, file });
      log(`fx ${name}`);
    }

    const result = {
      variant: 'plush',
      artboard: ARTBOARD,
      scale: SCALE,
      note: 'x, y, width, height và pivot tính theo đơn vị artboard 200x240; PNG ở 3x. parts xếp từ sau ra trước. visibleAtRest=false: biểu cảm phụ, ẩn mặc định.',
      parts,
      fx,
    };

    if (verify) {
      // Ảnh tham chiếu: cả nhân vật ở tư thế nghỉ, chụp cùng khung; ghép các lớp phải trùng.
      await evalJs('showAll()');
      const ref = await shot();
      const w = (ARTBOARD.width + pad * 2) * SCALE, h = (ARTBOARD.height + pad * 2) * SCALE;
      result.verify = await evalJs(`compareComposite(${JSON.stringify(layers)}, ${JSON.stringify(ref)}, ${w}, ${h})`);
      log(`Ghép lại so với gốc: sai khác trung bình ${result.verify.mean.toFixed(3)}/255, lớn nhất ${result.verify.max}, ${result.verify.badPixels} điểm lệch`);
    }
    const { verify: v, ...manifest } = result;
    writeFileSync(join(out, 'parts.json'), JSON.stringify(manifest, null, 2) + '\n');
    writeFileSync(join(out, 'parts.md'), partsTable(manifest));
    return result;
  } finally {
    close();
  }
}

/** Bảng vị trí để người dựng Rive đặt ảnh: Rive đặt ảnh theo tâm, nên có thêm cột tâm. */
function partsTable({ parts }) {
  const row = (p) => `| \`${p.name}\` | ${p.visibleAtRest ? 'có' : 'không'} | ${p.x} | ${p.y} | ${p.width} | ${p.height} | ${round(p.x + p.width / 2)} | ${round(p.y + p.height / 2)} | ${p.pivot ? p.pivot.join(', ') : '-'} |`;
  return `# Vị trí các bộ phận (bản plush)

Sinh bởi \`tools/export-layers.mjs\`, đừng sửa tay. Đơn vị artboard 200x240, gốc ở góc trên trái, y hướng xuống.
PNG ở 3x: đặt kích thước ảnh trong Rive bằng cột rộng x cao (hoặc thu về 33,33%).
Tâm = nơi đặt ảnh nếu Rive đặt theo tâm. Pivot = tâm xoay gợi ý cho bone.

| Bộ phận | Hiện lúc nghỉ | x | y | rộng | cao | tâm x | tâm y | pivot |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${parts.map(row).join('\n')}
`;
}

const round = (n) => Math.round(n * 100) / 100;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) =>
    a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true'] : null).filter(Boolean));
  const result = await exportLayers({ out: args.out || join(root, 'art', 'plush'), chrome: args.chrome, verify: args.verify === 'true', log: console.log });
  console.log(`Xong: ${result.parts.length} bộ phận, ${result.fx.length} hiệu ứng`);
  if (result.verify && (result.verify.mean > 0.5 || result.verify.badPixels > 50)) { console.error('Ghép lại KHÔNG trùng ảnh gốc'); process.exit(1); }
}
