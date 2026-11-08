// Ghép rig + hình học + texture + animation thành một file GLB.
import { GLB, CT, TARGET } from './glb.mjs';
import { BONES, MATERIALS, buildParts, srgb } from './rig.mjs';
import { Pose, CLIPS, HIDDEN } from './anims.mjs';
import { fixWinding, rotM } from './geometry.mjs';
import { furTextures, suedeNormal, tagTextures } from './textures.mjs';

export const FPS = 30;
export const LODS = [
  { name: 'bipbip', q: 1, textures: 'full' },
  { name: 'bipbip_lod1', q: 0.6, textures: 'full' },
  { name: 'bipbip_lod2', q: 0.38, textures: 'min' },
];

const D2R = Math.PI / 180;
function quat([rx, ry, rz]) { // Rz*Ry*Rx
  const [a, b, c] = [rx * D2R / 2, ry * D2R / 2, rz * D2R / 2];
  const [sx, cx, sy, cy, sz, cz] = [Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b), Math.sin(c), Math.cos(c)];
  return [cz * cy * sx - sz * sy * cx, cz * sy * cx + sz * cy * sx, sz * cy * cx - cz * sy * sx, cz * cy * cx + sz * sy * sx];
}

let texCache = null;
function textures() {
  texCache ??= { fur: furTextures(256, 7), suede: suedeNormal(128, 11), tag: tagTextures(256, 3) };
  return texCache;
}

export function buildGLB(spec, lod = LODS[0]) {
  const g = new GLB(); const J = g.json;
  const { skinned, attach } = buildParts(lod.q);
  for (const p of [...skinned, ...attach.flatMap((a) => a.parts)]) fixWinding(p.geo);
  const stats = { triangles: 0, hiddenTriangles: 0, textures: 0, textureBytes: 0 };
  const full = lod.textures === 'full';

  // ---- texture + vật liệu ----
  const T = textures(); const texIdx = {};
  J.samplers.push({ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 });
  const addTex = (key, png) => { J.images.length; const src = g.image(png); J.textures.push({ source: src, sampler: 0 }); texIdx[key] = J.textures.length - 1; stats.textures++; stats.textureBytes += png.length; };
  addTex('fur_n', T.fur.normal);
  if (full) { addTex('fur_a', T.fur.albedo); addTex('suede_n', T.suede); addTex('tag_a', T.tag.albedo); addTex('tag_n', T.tag.normal); }
  const matIdx = {}; const usesSheen = []; let usesUnlit = false;
  const usedMats = new Set([...skinned.map((s) => s.mat), ...attach.flatMap((a) => a.parts.map((p) => p.mat))]);
  for (const [name, m] of Object.entries(MATERIALS)) {
    if (!usedMats.has(name)) continue;
    const mat = { name, pbrMetallicRoughness: { baseColorFactor: [...srgb(m.color), 1], metallicFactor: 0, roughnessFactor: m.rough ?? 1 } };
    if (m.tex === 'fur') {
      mat.normalTexture = { index: texIdx.fur_n, scale: 1 };
      if (full) mat.pbrMetallicRoughness.baseColorTexture = { index: texIdx.fur_a };
    } else if (m.tex === 'suede') {
      mat.normalTexture = { index: full ? texIdx.suede_n : texIdx.fur_n, scale: 0.6 };
    } else if (m.tex === 'tag' && full) {
      mat.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
      mat.pbrMetallicRoughness.baseColorTexture = { index: texIdx.tag_a };
      mat.normalTexture = { index: texIdx.tag_n, scale: 1 };
    }
    if (m.sheen) { mat.extensions = { KHR_materials_sheen: { sheenColorFactor: srgb(m.sheen), sheenRoughnessFactor: 0.6 } }; usesSheen.push(name); }
    if (m.emissive) mat.emissiveFactor = srgb(m.emissive);
    if (m.unlit) { mat.extensions = { KHR_materials_unlit: {} }; usesUnlit = true; }
    J.materials.push(mat); matIdx[name] = J.materials.length - 1;
  }
  J.extensionsUsed = [...(usesSheen.length ? ['KHR_materials_sheen'] : []), ...(usesUnlit ? ['KHR_materials_unlit'] : [])];

  // ---- xương (node) ----
  const boneIdx = Object.fromEntries(BONES.map((b, i) => [b.name, i]));
  const boneWorld = Object.fromEntries(BONES.map((b) => [b.name, b.pos]));
  for (const b of BONES) {
    const par = b.parent ? boneWorld[b.parent] : [0, 0, 0];
    g.node({ name: b.name, translation: b.pos.map((v, i) => +(v - par[i]).toFixed(6)), children: [] });
  }
  for (const b of BONES) if (b.parent) J.nodes[boneIdx[b.parent]].children.push(boneIdx[b.name]);
  // node bật/tắt
  const attIdx = {};
  for (const a of attach) {
    const pw = boneWorld[a.parent];
    const primitives = a.parts.map((p) => primitive(g, p.geo, matIdx[p.mat], null, p.geo.col));
    const mi = J.meshes.push({ name: a.name, primitives }) - 1;
    const ni = g.node({ name: a.name, mesh: mi, translation: a.pos.map((v, i) => +(v - pw[i]).toFixed(6)), scale: [HIDDEN, HIDDEN, HIDDEN] });
    J.nodes[boneIdx[a.parent]].children.push(ni); attIdx[a.name] = ni;
    for (const p of a.parts) stats.hiddenTriangles += p.geo.triangleCount;
  }
  for (const n of J.nodes) if (n.children && !n.children.length) delete n.children;
  // mesh có skin: gom theo vật liệu
  const byMat = new Map();
  for (const s of skinned) { if (!byMat.has(s.mat)) byMat.set(s.mat, []); byMat.get(s.mat).push(s); }
  const prims = [];
  for (const [mat, list] of byMat) {
    const merged = { pos: [], nrm: [], uv: [], idx: [], joints: [] }; let base = 0;
    for (const s of list) {
      merged.pos.push(...s.geo.pos); merged.nrm.push(...s.geo.nrm); merged.uv.push(...s.geo.uv);
      for (const i of s.geo.idx) merged.idx.push(i + base);
      for (let i = 0; i < s.geo.vertexCount; i++) merged.joints.push(boneIdx[s.bone], 0, 0, 0);
      base += s.geo.vertexCount; stats.triangles += s.geo.triangleCount;
    }
    prims.push(primitive(g, merged, matIdx[mat], merged.joints));
  }
  const meshIdx = J.meshes.push({ name: 'BipBip', primitives: prims }) - 1;
  const ibm = new Float32Array(BONES.length * 16);
  BONES.forEach((b, i) => { ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -b.pos[0], -b.pos[1], -b.pos[2], 1], i * 16); });
  const skin = J.skins.push({ name: 'BipBipSkin', joints: BONES.map((_, i) => i), inverseBindMatrices: g.accessor(ibm, 'MAT4', CT.FLOAT), skeleton: 0 }) - 1;
  const meshNode = g.node({ name: 'BipBipMesh', mesh: meshIdx, skin });
  J.scenes[0].nodes = [0, meshNode];

  // ---- animation ----
  const jointNames = BONES.map((b) => b.name), attNames = attach.map((a) => a.name);
  const clips = {};
  for (const [name, info] of Object.entries(spec.states)) {
    const n = Math.max(2, Math.round((info.durationMs / 1000) * FPS)); const frames = [];
    for (let i = 0; i <= n; i++) { const f = new Pose(jointNames, attNames); CLIPS[name](info.loop ? (i % n) / n : i / n, f); frames.push(f.m); }
    clips[name] = { frames, n, dur: info.durationMs / 1000 };
  }
  const restOf = (node, path) => (path === 'scale' ? (attNames.includes(node) ? [HIDDEN, HIDDEN, HIDDEN] : [1, 1, 1]) : path === 'rotation' ? [0, 0, 0] : [0, 0, 0]);
  const value = (m, node, path) => { const o = m.get(node); return path === 'scale' ? o.s : path === 'rotation' ? o.r : o.t; };
  const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  const channels = []; // union: nodes/paths bị bất kỳ clip nào động tới
  for (const node of [...jointNames, ...attNames]) for (const path of ['translation', 'rotation', 'scale']) {
    const rest = restOf(node, path);
    if (Object.values(clips).some((c) => c.frames.some((m) => !near(value(m, node, path), rest)))) channels.push({ node, path });
  }
  const nodeIndex = (name) => (name in boneIdx ? boneIdx[name] : attIdx[name]);
  const restT = (node) => J.nodes[nodeIndex(node)].translation;
  const animStats = {};
  // Gom dữ liệu animation vào một bufferView duy nhất, dùng chung mảng thời gian trùng nhau (giảm JSON).
  const pend = []; let animLen = 0; const timeShare = new Map();
  const queue = (arr, type, mm) => { const pad = (4 - (animLen % 4)) % 4; animLen += pad; const e = { off: animLen, arr, type, mm }; pend.push(e); animLen += arr.byteLength; return e; };
  const animDefs = [];
  for (const [name, c] of Object.entries(clips)) {
    const samplers = [], chans = []; let keyTotal = 0;
    for (const { node, path } of channels) {
      const vals = c.frames.map((m) => {
        const o = m.get(node);
        if (path === 'translation') return o.t.map((v, i) => v + restT(node)[i]);
        if (path === 'scale') return o.s;
        return quat(o.r);
      });
      if (path === 'rotation') for (let i = 1; i < vals.length; i++) { const d = vals[i].reduce((sum, v, k) => sum + v * vals[i - 1][k], 0); if (d < 0) vals[i] = vals[i].map((v) => -v); }
      const keep = reduceKeys(vals, path === 'rotation' ? 4e-4 : path === 'scale' ? 1e-3 : 8e-5);
      const times = new Float32Array(keep.map((i) => (i / c.n) * c.dur)); times[times.length - 1] = c.dur;
      const tk = name + ':' + times.join(',');
      if (!timeShare.has(tk)) timeShare.set(tk, queue(times, 'SCALAR', true));
      const outArr = new Float32Array(keep.flatMap((i) => vals[i]));
      const ok = path + ':' + outArr.join(',');
      if (!timeShare.has(ok)) timeShare.set(ok, queue(outArr, path === 'rotation' ? 'VEC4' : 'VEC3', false));
      const outE = timeShare.get(ok);
      keyTotal += keep.length;
      samplers.push({ in: timeShare.get(tk), out: outE });
      chans.push({ sampler: samplers.length - 1, target: { node: nodeIndex(node), path } });
    }
    animDefs.push({ name, samplers, channels: chans });
    animStats[name] = { keys: keyTotal, durationMs: spec.states[name].durationMs, loop: spec.states[name].loop };
  }
  const animBuf = Buffer.alloc(animLen);
  for (const e of pend) Buffer.from(e.arr.buffer, e.arr.byteOffset, e.arr.byteLength).copy(animBuf, e.off);
  const animView = g.view(animBuf);
  const accOf = (e) => {
    if (e.acc !== undefined) return e.acc;
    const comps = { SCALAR: 1, VEC3: 3, VEC4: 4 }[e.type]; const a = { bufferView: animView, byteOffset: e.off, componentType: CT.FLOAT, count: e.arr.length / comps, type: e.type };
    if (e.mm) { a.min = [Math.min(...e.arr)]; a.max = [Math.max(...e.arr)]; }
    J.accessors.push(a); e.acc = J.accessors.length - 1; return e.acc;
  };
  for (const d of animDefs) J.animations.push({ name: d.name, samplers: d.samplers.map((x) => ({ input: accOf(x.in), output: accOf(x.out), interpolation: 'LINEAR' })), channels: d.channels });

  J.asset.extras = {
    bipbip: {
      name: spec.name, lod: lod.name, fps: FPS, units: 'meter', up: 'Y', forward: '+Z',
      states: Object.fromEntries(Object.entries(spec.states).map(([k, v]) => [k, { loop: v.loop, durationMs: v.durationMs }])),
      bones: jointNames, toggles: attNames, hiddenScale: HIDDEN,
      runtime: { lookBones: ['eye_l', 'eye_r'], capNode: 'fx_cap', blinkScalePath: 'scale' },
    },
  };
  return { buffer: g.toBuffer(), stats: { ...stats, drawCalls: prims.length, animations: animStats, channels: channels.length, materials: J.materials.length } };
}

/** Giữ khóa đầu, cuối và các khóa mà nội suy tuyến tính từ khóa trước đã giữ không còn đủ gần. */
function reduceKeys(vals, eps) {
  const n = vals.length; const keep = [0];
  let last = 0;
  for (let i = 1; i < n - 1; i++) {
    let ok = true;
    for (let k = last + 1; k <= i + 1 && ok; k++) { // thử bỏ qua i: nội suy last → i+1
      const t = (k - last) / (i + 1 - last);
      for (let c = 0; c < vals[0].length; c++) if (Math.abs(vals[last][c] + (vals[i + 1][c] - vals[last][c]) * t - vals[k][c]) > eps) { ok = false; break; }
    }
    if (!ok) { keep.push(i); last = i; }
  }
  keep.push(n - 1);
  return keep;
}

function primitive(g, geo, material, joints, col) {
  const J = g.json;
  const pos = new Float32Array(geo.pos), nrm = new Float32Array(geo.nrm), uv = new Float32Array(geo.uv);
  if (geo.pos.length / 3 > 65535) throw new Error('quá 65535 đỉnh');
  const attributes = {
    POSITION: g.accessor(pos, 'VEC3', CT.FLOAT, { target: TARGET.ARRAY, minmax: true }),
    NORMAL: g.accessor(nrm, 'VEC3', CT.FLOAT, { target: TARGET.ARRAY }),
    TEXCOORD_0: g.accessor(uv, 'VEC2', CT.FLOAT, { target: TARGET.ARRAY }),
  };
  if (joints) {
    attributes.JOINTS_0 = g.accessor(new Uint8Array(joints), 'VEC4', CT.UBYTE, { target: TARGET.ARRAY });
    const w = new Float32Array(joints.length); for (let i = 0; i < w.length; i += 4) w[i] = 1;
    attributes.WEIGHTS_0 = g.accessor(w, 'VEC4', CT.FLOAT, { target: TARGET.ARRAY });
  }
  if (col) attributes.COLOR_0 = g.accessor(new Float32Array(col), 'VEC3', CT.FLOAT, { target: TARGET.ARRAY });
  void J;
  return { attributes, indices: g.accessor(new Uint16Array(geo.idx), 'SCALAR', CT.USHORT, { target: TARGET.ELEMENT }), material, mode: 4 };
}
void rotM;
