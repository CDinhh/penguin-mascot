// Dựng art/3d/*.glb từ spec/mascot.json. Chạy: npm run build:3d   (kiểm tra không ghi: --check)
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGLB, LODS } from './model.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const spec = JSON.parse(readFileSync(join(root, 'spec/mascot.json'), 'utf8'));
const out = join(root, 'art/3d');
const check = process.argv.includes('--check');
mkdirSync(out, { recursive: true });
const manifest = { generatedBy: 'tools/model3d/build.mjs', lods: {} };
let bad = 0;
for (const lod of LODS) {
  const { buffer, stats } = buildGLB(spec, lod);
  const file = join(out, `${lod.name}.glb`);
  if (check) { if (!existsSync(file) || !readFileSync(file).equals(buffer)) { console.error(`${lod.name}.glb không khớp; chạy npm run build:3d`); bad++; } }
  else writeFileSync(file, buffer);
  manifest.lods[lod.name] = { file: `${lod.name}.glb`, bytes: buffer.length, triangles: stats.triangles, drawCalls: stats.drawCalls, textures: stats.textures, textureBytes: stats.textureBytes, materials: stats.materials, hiddenToggleTriangles: stats.hiddenTriangles };
  if (lod === LODS[0]) manifest.animations = stats.animations;
  console.log(`${lod.name}: ${(buffer.length / 1024).toFixed(0)} KB, ${stats.triangles} tam giác, ${stats.drawCalls} draw call, ${stats.textures} texture`);
}
if (!check) writeFileSync(join(out, 'bipbip.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
process.exit(bad ? 1 : 0);
