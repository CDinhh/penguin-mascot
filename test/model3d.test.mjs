// Kiểm tra model 3D: khớp spec, rig, clip, ngân sách (xem docs/PLAN-3D.md mục 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildGLB, LODS } from '../tools/model3d/model.mjs';
import { BONES } from '../tools/model3d/rig.mjs';

const root = new URL('../', import.meta.url);
const spec = JSON.parse(readFileSync(new URL('spec/mascot.json', root), 'utf8'));
const BUDGET = { bipbip: { tris: 12000, bytes: 1.3e6 }, bipbip_lod1: { tris: 5000, bytes: 1.1e6 }, bipbip_lod2: { tris: 1800, bytes: 0.7e6 } };

function parse(buf) {
  assert.equal(buf.readUInt32LE(0), 0x46546c67, 'magic glTF');
  assert.equal(buf.readUInt32LE(8), buf.length, 'độ dài header');
  const jl = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jl).toString());
  const bin = buf.subarray(20 + jl + 8);
  return { json, bin };
}
function read(m, i) {
  const a = m.json.accessors[i], v = m.json.bufferViews[a.bufferView];
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
  const Ctor = { 5126: Float32Array, 5121: Uint8Array, 5123: Uint16Array }[a.componentType];
  const off = m.bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0);
  return new Ctor(m.bin.buffer.slice(off, off + a.count * comps * Ctor.BYTES_PER_ELEMENT));
}

const models = LODS.map((lod) => ({ lod, ...buildGLB(spec, lod) }));
for (const m of models) m.gltf = parse(m.buffer);

test('art/3d/*.glb trùng với kết quả dựng từ spec (chạy npm run build:3d nếu lệch)', () => {
  for (const m of models) assert.ok(readFileSync(new URL(`art/3d/${m.lod.name}.glb`, root)).equals(m.buffer), m.lod.name);
});

test('bản chép trong packages/web-3d/models giống art/3d', () => {
  for (const m of models) assert.ok(readFileSync(new URL(`packages/web-3d/models/${m.lod.name}.glb`, root)).equals(m.buffer), m.lod.name);
});

test('mỗi trạng thái trong spec có đúng một clip cùng tên và thời lượng', () => {
  for (const m of models) {
    const { json } = m.gltf;
    assert.deepEqual(json.animations.map((a) => a.name).sort(), Object.keys(spec.states).sort(), m.lod.name);
    for (const a of json.animations) {
      const dur = Math.max(...a.samplers.map((s) => json.accessors[s.input].max[0]));
      assert.ok(Math.abs(dur * 1000 - spec.states[a.name].durationMs) < 0.5, `${a.name} ${dur}`);
    }
    assert.deepEqual(json.asset.extras.bipbip.states, Object.fromEntries(Object.entries(spec.states).map(([k, v]) => [k, { loop: v.loop, durationMs: v.durationMs }])));
  }
});

test('mọi clip có cùng tập kênh (trộn clip không dính trạng thái clip trước)', () => {
  const { json } = models[0].gltf;
  const key = (a) => a.channels.map((c) => `${c.target.node}:${c.target.path}`).sort().join('|');
  const first = key(json.animations[0]);
  for (const a of json.animations) assert.equal(key(a), first, a.name);
});

test('clip lặp: khung cuối bằng khung đầu; clip một lần: về tư thế nghỉ', () => {
  const m = models[0].gltf; const { json } = m;
  for (const a of json.animations) {
    for (const c of a.channels) {
      const out = read(m, a.samplers[c.sampler].output); const n = c.target.path === 'rotation' ? 4 : 3;
      const first = [...out.slice(0, n)], last = [...out.slice(out.length - n)];
      first.forEach((v, i) => assert.ok(Math.abs(v - last[i]) < 2e-3 || (c.target.path === 'rotation' && Math.abs(Math.abs(v) - Math.abs(last[i])) < 2e-3), `${a.name} ${json.nodes[c.target.node].name}.${c.target.path}`));
    }
  }
});

test('rig: đúng thứ tự xương trong hợp đồng, 1 skin, dưới 32 xương', () => {
  for (const m of models) {
    const { json } = m.gltf;
    assert.equal(json.skins.length, 1);
    assert.deepEqual(json.skins[0].joints.map((j) => json.nodes[j].name), BONES.map((b) => b.name));
    assert.ok(json.skins[0].joints.length <= 32);
    const prim = json.meshes.find((x) => x.name === 'BipBip').primitives[0];
    const joints = read(m.gltf, prim.attributes.JOINTS_0);
    assert.ok(Math.max(...joints) < BONES.length);
  }
});

test('node bật/tắt ẩn lúc nghỉ, tên bắt đầu bằng fx_', () => {
  const { json } = models[0].gltf;
  const toggles = json.asset.extras.bipbip.toggles;
  assert.ok(toggles.length >= 20);
  for (const n of toggles) {
    const node = json.nodes.find((x) => x.name === n);
    assert.ok(node && node.name.startsWith('fx_'), n);
    assert.ok(node.scale.every((s) => s < 0.01), n);
  }
});

test('kích thước: cao ~1 m, chân chạm đất, quay mặt về +Z', () => {
  const { json } = models[0].gltf;
  const prim = json.meshes.find((x) => x.name === 'BipBip').primitives[0];
  const acc = json.accessors[prim.attributes.POSITION];
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const p of json.meshes.find((x) => x.name === 'BipBip').primitives) { const a = json.accessors[p.attributes.POSITION]; a.min.forEach((v, i) => { mn[i] = Math.min(mn[i], v); mx[i] = Math.max(mx[i], a.max[i]); }); }
  void acc;
  assert.ok(mn[1] > -0.001 && mn[1] < 0.05, `đáy ${mn[1]}`);
  assert.ok(mx[1] > 0.95 && mx[1] < 1.1, `đỉnh ${mx[1]}`);
  assert.ok(mx[2] > Math.abs(mn[2]), 'mặt về +Z');
});

test('ngân sách tam giác, draw call, texture, dung lượng theo LOD', () => {
  let prev = Infinity;
  for (const m of models) {
    const b = BUDGET[m.lod.name];
    assert.ok(m.stats.triangles <= b.tris, `${m.lod.name} ${m.stats.triangles} tam giác`);
    assert.ok(m.stats.triangles < prev, 'LOD sau phải nhẹ hơn');
    prev = m.stats.triangles;
    assert.ok(m.stats.drawCalls <= 12, `${m.lod.name} draw call`);
    assert.ok(m.buffer.length <= b.bytes, `${m.lod.name} ${m.buffer.length} byte`);
    assert.ok(m.stats.textures <= 5 && m.stats.textureBytes < 1e6, `${m.lod.name} texture`);
    assert.ok(m.stats.hiddenTriangles < 6000, 'node bật/tắt nhẹ');
  }
  assert.equal(models[2].stats.textures, 1, 'LOD2 chỉ 1 texture');
});

test('chỉ số tam giác hợp lệ và normal đã chuẩn hóa', () => {
  const m = models[0].gltf; const { json } = m;
  for (const mesh of json.meshes) for (const p of mesh.primitives) {
    const n = json.accessors[p.attributes.POSITION].count;
    assert.ok(Math.max(...read(m, p.indices)) < n, mesh.name);
    const nr = read(m, p.attributes.NORMAL);
    for (let i = 0; i < nr.length; i += 3) assert.ok(Math.abs(Math.hypot(nr[i], nr[i + 1], nr[i + 2]) - 1) < 1e-3, `${mesh.name} normal`);
  }
});
