// Renderer 3D cho <penguin-mascot>: thêm renderer="3d" (three.js, model glTF `models/bipbip*.glb`).
//
//   import 'three';                         // peer dependency
//   import '@prm393/penguin-mascot';        // web component
//   import '@prm393/penguin-mascot-3d';     // đăng ký renderer "3d"
//   <penguin-mascot renderer="3d" state="idle" size="200" accessory="cap" track-pointer></penguin-mascot>
//
// Thiết kế nhẹ cho nhiều nhân vật trên một trang: MỘT WebGLRenderer dùng chung (không vướng giới hạn số WebGL context),
// mỗi thẻ có canvas 2D nhận ảnh; chỉ vẽ thẻ đang nhìn thấy; LOD tự chọn theo kích thước; không bóng đổ thật (bóng giả bằng 1 tam giác).
// Không nạp được model (thiếu file, WebGL bị tắt) thì thẻ tự lùi về SVG và phát sự kiện `rendererfallback`.
import {
  AnimationMixer, Color, Group, LoopOnce, LoopRepeat, Mesh, MeshBasicMaterial, CanvasTexture, NeutralToneMapping,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, DirectionalLight, WebGLRenderer, SRGBColorSpace,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { MascotDriver } from './driver.js';

// Viết từng đường dẫn tĩnh để bundler (Vite, webpack, ...) thấy và đóng gói file .glb.
const DEFAULT_URLS = [
  new URL('../models/bipbip.glb', import.meta.url).href,
  new URL('../models/bipbip_lod1.glb', import.meta.url).href,
  new URL('../models/bipbip_lod2.glb', import.meta.url).href,
];
const config = { baseUrl: null, urls: null, maxDpr: 2, maxPixels: 1024 };
export const LOD_FILES = ['bipbip.glb', 'bipbip_lod1.glb', 'bipbip_lod2.glb'];

/**
 * Cấu hình chung.
 * - baseUrl: thư mục chứa các file .glb (mặc định: các file đi kèm gói, bundler tự đóng gói).
 * - urls: hoặc đường dẫn riêng cho từng LOD, ví dụ ['/a.glb', '/b.glb', '/c.glb'].
 * - maxDpr, maxPixels: trần độ phân giải vẽ (mặc định 2 và 1024 px) để giữ 60 FPS trên máy yếu.
 */
export function configure(o = {}) { Object.assign(config, o); }

const HIDDEN = 0.01; // node fx_* có scale dưới ngưỡng này thì tắt hẳn (đỡ draw call)
const CAM = { fov: 23.5, dist: 3.6, lookY: 0.7 };  // khung nhìn khớp artboard 200x240 của bản 2D, chứa cả hiệu ứng bay lên đầu
const ASPECT = 200 / 240;

/** Chọn LOD theo số pixel chiều rộng thực (0 = chi tiết nhất). */
export function pickLod(px) { return px > 260 ? 0 : px > 110 ? 1 : 2; }

class Stage {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.renderer = new WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0); this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.setScissorTest(true);
    this.scene = new Scene();
    const pm = new PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.scene.environmentIntensity = 0.8; pm.dispose();
    const sun = new DirectionalLight(new Color('#fff3e0'), 2.2); sun.position.set(1.5, 2.5, 2.5); this.scene.add(sun);
    this.camera = new PerspectiveCamera(CAM.fov, ASPECT, 0.1, 30);
    this.camera.position.set(0.55, CAM.lookY + 0.28, CAM.dist); this.camera.lookAt(0, CAM.lookY, 0);
    this.instances = new Set(); this.raf = 0; this.last = 0; this.cache = new Map();
    this.shadowTex = makeShadowTexture();
    this.size = [0, 0];
  }

  load(lod) {
    if (!this.cache.has(lod)) {
      const url = config.urls ? config.urls[lod] : config.baseUrl ? config.baseUrl.replace(/\/?$/, '/') + LOD_FILES[lod] : DEFAULT_URLS[lod];
      this.cache.set(lod, new GLTFLoader().loadAsync(url).catch((e) => { this.cache.delete(lod); throw e; }));
    }
    return this.cache.get(lod);
  }

  add(inst) { this.instances.add(inst); this.scene.add(inst.group); this.kick(); }
  remove(inst) { this.instances.delete(inst); this.scene.remove(inst.group); }

  kick() { if (!this.raf && this.instances.size) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.frame(t)); } }

  frame(now) {
    this.raf = 0;
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    let live = false;
    const todo = [];
    for (const inst of this.instances) {
      if (!inst.visible || document.hidden || !inst.ready) continue;
      if (inst.driver.reduce) { if (inst.dirty) { inst.dirty = false; todo.push(inst); } continue; }
      live = true; inst.update(dt); todo.push(inst);
    }
    for (const g of this.instances) g.group.visible = false;
    for (const inst of todo) this.draw(inst);
    if (live) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  draw(inst) {
    const { w, h } = inst.px; // pixel thật (đã nhân DPR)
    if (this.size[0] < w || this.size[1] < h) { this.renderer.setPixelRatio(1); this.renderer.setSize(Math.max(w, this.size[0]), Math.max(h, this.size[1]), false); this.size = [this.renderer.domElement.width, this.renderer.domElement.height]; }
    this.renderer.setViewport(0, 0, w, h); this.renderer.setScissor(0, 0, w, h);
    this.renderer.clear();
    inst.group.visible = true;
    this.renderer.render(this.scene, this.camera);
    inst.group.visible = false;
    const c = inst.ctx2d;
    c.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
    c.drawImage(this.canvas, 0, this.canvas.height - h, w, h, 0, 0, w, h);
  }
}

function makeShadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(40,50,80,.45)'); r.addColorStop(1, 'rgba(40,50,80,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

let stage = null;
const getStage = () => (stage ??= new Stage());

/** Factory theo giao thức PenguinMascot.registerRenderer. */
export function createThreeRenderer(root, ctx) {
  const host = ctx.host;
  const st = getStage(); // ném lỗi nếu không có WebGL: thẻ tự lùi về SVG
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'BipBip');
  const style = document.createElement('style');
  style.textContent = '.pg-3d{display:block;width:100%;height:auto;aspect-ratio:200/240}';
  canvas.className = 'pg-3d';
  root.append(style, canvas);

  const reduceMq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const inst = {
    canvas, ctx2d: canvas.getContext('2d'), group: new Group(), visible: true, ready: false, dirty: true, px: { w: 1, h: 1 },
    driver: null, model: null, mixer: null, lod: -1, look: { x: 0, y: 0, tx: 0, ty: 0 }, cap: false, toggles: [], eyes: [], rootBone: null, shadow: null,
    update(dt) {
      this.mixer.update(dt);
      for (const o of this.toggles) o.visible = o.scale.x > HIDDEN;
      const k = 1 - Math.exp(-dt * 12); // làm mượt ánh nhìn
      this.look.x += (this.look.tx - this.look.x) * k; this.look.y += (this.look.ty - this.look.y) * k;
      for (const e of this.eyes) e.rotation.set(this.look.y * 0.3, this.look.x * 0.42, 0);
      if (this.shadow && this.rootBone) { const s = 1 - Math.min(0.5, this.rootBone.position.y * 3); this.shadow.scale.set(0.7 * s, 0.5 * s, 1); }
    },
  };
  inst.group.visible = false;
  let destroyed = false; let pendingState = 'idle'; let wantDone = null;

  const wantsCap = () => /(^|\s)cap(\s|$)/.test(host.getAttribute('accessory') || '');
  const readLook = () => { inst.look.tx = clamp(parseFloat(host.getAttribute('look-x')) || 0); inst.look.ty = clamp(parseFloat(host.getAttribute('look-y')) || 0); inst.dirty = true; };
  const applyCap = () => { inst.cap = wantsCap(); const c = inst.model?.getObjectByName('fx_cap'); if (c) { const v = inst.cap ? 1 : 0.001; c.scale.setScalar(v); c.visible = inst.cap; } inst.dirty = true; };

  const measure = () => {
    const dpr = Math.min(config.maxDpr, window.devicePixelRatio || 1);
    const cssW = host.clientWidth || canvas.clientWidth || 200;
    let w = Math.min(config.maxPixels, Math.max(32, Math.round(cssW * dpr))); let h = Math.round(w / ASPECT);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; inst.dirty = true; }
    inst.px = { w, h };
    const lod = pickLod(w);
    if (lod !== inst.lod && inst.model) mount(lod); // đổi LOD khi đổi cỡ
  };

  async function mount(lod) {
    const my = lod; inst.lod = lod; inst.ready = false;
    if (inst.driver) pendingState = inst.driver.base; // đổi LOD giữa chừng: giữ trạng thái lặp đang chạy
    const gltf = await st.load(lod).catch((e) => { if (!destroyed) ctx.fail(e); return null; });
    if (!gltf || destroyed || inst.lod !== my) return;
    teardownModel();
    const model = SkeletonUtils.clone(gltf.scene);
    model.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    const extras = gltf.parser.json.asset.extras.bipbip;
    inst.model = model; inst.group.add(model);
    inst.toggles = []; model.traverse((o) => { if (o.name.startsWith('fx_') && !o.isBone) inst.toggles.push(o); });
    inst.eyes = ['eye_l', 'eye_r'].map((n) => model.getObjectByName(n)).filter(Boolean);
    inst.rootBone = model.getObjectByName('root');
    inst.mixer = new AnimationMixer(model);
    inst.driver = new MascotDriver({ THREE: { LoopOnce, LoopRepeat }, mixer: inst.mixer, clips: gltf.animations, states: extras.states });
    inst.driver.setReduceMotion(!!(reduceMq && reduceMq.matches));
    if (!inst.shadow) { inst.shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: st.shadowTex, transparent: true, depthWrite: false, toneMapped: false })); inst.shadow.rotation.x = -Math.PI / 2; inst.shadow.position.y = 0.002; inst.shadow.renderOrder = -1; inst.group.add(inst.shadow); }
    inst.ready = true; applyCap(); readLook();
    const p = inst.driver.play(pendingState); if (wantDone) { p.then(wantDone.resolve); wantDone = null; }
    inst.mixer.update(0.0001); for (const o of inst.toggles) o.visible = o.scale.x > HIDDEN;
    st.kick();
  }
  function teardownModel() {
    if (inst.driver) inst.driver.destroy();
    if (inst.model) { inst.group.remove(inst.model); inst.mixer.stopAllAction(); inst.mixer.uncacheRoot(inst.model); }
    inst.model = null;
  }

  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((e) => { inst.visible = e[e.length - 1].isIntersecting; if (inst.visible) { inst.dirty = true; st.kick(); } }) : null;
  io && io.observe(host);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  ro && ro.observe(host);
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(() => { applyCap(); readLook(); st.kick(); }) : null;
  mo && mo.observe(host, { attributes: true, attributeFilter: ['accessory', 'look-x', 'look-y'] });
  const onReduce = () => { inst.driver && inst.driver.setReduceMotion(!!reduceMq.matches); inst.dirty = true; st.kick(); };
  reduceMq && reduceMq.addEventListener('change', onReduce);
  const onVis = () => st.kick();
  document.addEventListener('visibilitychange', onVis);
  const onPointer = (e) => {
    if (!host.hasAttribute('track-pointer')) return;
    const r = host.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height * 0.32;
    inst.look.tx = clamp((e.clientX - cx) / 400); inst.look.ty = clamp(-(e.clientY - cy) / 400);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  st.add(inst); measure(); mount(pickLod(inst.px.w));

  return {
    play(state) {
      pendingState = state;
      if (!inst.ready) return new Promise((resolve) => { wantDone = { resolve }; }); // chưa nạp xong: áp dụng khi nạp xong
      return inst.driver.play(state);
    },
    destroy() {
      destroyed = true; st.remove(inst); teardownModel();
      io && io.disconnect(); ro && ro.disconnect(); mo && mo.disconnect();
      reduceMq && reduceMq.removeEventListener('change', onReduce);
      document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pointermove', onPointer);
      canvas.remove(); style.remove();
    },
  };
}
const clamp = (v) => Math.max(-1, Math.min(1, v));

if (typeof window !== 'undefined' && window.PenguinMascot) {
  window.PenguinMascot.registerRenderer('3d', createThreeRenderer);
} else if (typeof window !== 'undefined') {
  console.warn('[penguin-mascot-3d] Hãy nạp penguin.js trước gói này.');
}
