// Ghi file GLB (glTF 2.0 nhị phân) tối giản.
export class GLB {
  constructor() { this.json = { asset: { version: '2.0', generator: 'penguin-mascot tools/model3d' }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], skins: [], materials: [], accessors: [], bufferViews: [], buffers: [{ byteLength: 0 }], animations: [], textures: [], images: [], samplers: [] }; this.chunks = []; this.len = 0; }
  view(bytes, target) {
    const pad = (4 - (this.len % 4)) % 4; if (pad) { this.chunks.push(Buffer.alloc(pad)); this.len += pad; }
    const v = { buffer: 0, byteOffset: this.len, byteLength: bytes.length }; if (target) v.target = target;
    this.chunks.push(Buffer.from(bytes)); this.len += bytes.length;
    this.json.bufferViews.push(v); return this.json.bufferViews.length - 1;
  }
  /** arr: TypedArray; type SCALAR|VEC2|...; ct: componentType GL enum. */
  accessor(arr, type, ct, { target, minmax = false, normalized = false } = {}) {
    const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const a = { bufferView: this.view(new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength), target), componentType: ct, count: arr.length / comps, type };
    if (normalized) a.normalized = true;
    if (minmax) { const mn = Array(comps).fill(Infinity), mx = Array(comps).fill(-Infinity); for (let i = 0; i < arr.length; i++) { const k = i % comps; mn[k] = Math.min(mn[k], arr[i]); mx[k] = Math.max(mx[k], arr[i]); } a.min = mn; a.max = mx; }
    this.json.accessors.push(a); return this.json.accessors.length - 1;
  }
  image(png) { this.json.images.push({ bufferView: this.view(png), mimeType: 'image/png' }); return this.json.images.length - 1; }
  node(n) { this.json.nodes.push(n); return this.json.nodes.length - 1; }
  toBuffer() {
    const pad = (4 - (this.len % 4)) % 4; const bin = Buffer.concat([...this.chunks, Buffer.alloc(pad)]);
    this.json.buffers[0].byteLength = bin.length;
    for (const k of Object.keys(this.json)) if (Array.isArray(this.json[k]) && this.json[k].length === 0) delete this.json[k];
    let js = Buffer.from(JSON.stringify(this.json)); const jp = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
    const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
    const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4e4f534a, 4);
    const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004e4942, 4);
    return Buffer.concat([head, c1, js, c2, bin]);
  }
}
export const CT = { BYTE: 5120, UBYTE: 5121, SHORT: 5122, USHORT: 5123, UINT: 5125, FLOAT: 5126 };
export const TARGET = { ARRAY: 34962, ELEMENT: 34963 };
