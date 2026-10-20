// Thêm renderer="rive" cho <penguin-mascot>. Dùng:
//
//   import '@prm393/penguin-mascot';        // web component (hoặc <script src="penguin.js">)
//   import '@prm393/penguin-mascot-rive';   // đăng ký renderer "rive"
//   <penguin-mascot renderer="rive" state="idle" size="160"></penguin-mascot>
//
// File .riv lấy từ thuộc tính `rive-src`, hoặc configure({ src }), hoặc spec.rive.file (tương đối với trang).
// Không nạp được file (thiếu, hỏng, thiếu input) thì thẻ tự lùi về SVG và phát sự kiện `rendererfallback`.
import { Rive, EventType, RuntimeLoader } from '@rive-app/canvas';
import { RiveDriver } from './driver.js';
import { SPEC } from './spec.generated.js';

const config = { src: null };

/**
 * Cấu hình chung.
 * - src: đường dẫn mặc định của file .riv cho mọi thẻ.
 * - wasmUrl: nơi tự host rive.wasm (mặc định runtime tải từ CDN của Rive); dùng khi chạy offline hoặc cần kiểm soát nguồn tải.
 */
export function configure({ src, wasmUrl } = {}) {
  if (src) config.src = src;
  if (wasmUrl) RuntimeLoader.setWasmUrl(wasmUrl);
}

const STYLE = '.pg-rive{display:block;width:100%;height:auto;aspect-ratio:200/240}';

/** Factory theo giao thức PenguinMascot.registerRenderer. Xuất ra để test và để đăng ký tay. */
export function createRiveRenderer(root, ctx, deps = { Rive, EventType }) {
  const host = ctx.host;
  const canvas = document.createElement('canvas');
  canvas.className = 'pg-rive';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', SPEC.name);
  const style = document.createElement('style');
  style.textContent = STYLE;
  root.append(style, canvas);

  const reduce = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let visible = true;
  let driver;
  const sync = () => driver && driver.setPaused(!visible || document.hidden || !!(reduce && reduce.matches));

  // accessory="cap" của web component -> property `cap` của view model
  const wantsCap = () => /(^|\s)cap(\s|$)/.test(host.getAttribute('accessory') || '');
  driver = new RiveDriver({
    ...deps,
    canvas,
    cap: wantsCap(),
    src: host.getAttribute('rive-src') || config.src || SPEC.rive.file,
    variant: ctx.variant,
    onError: ctx.fail,
    onReady: () => { driver.resize(); sync(); },
  });

  // Dừng vẽ khi khuất màn hình, tab ẩn, hoặc người dùng chọn giảm chuyển động
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; sync(); })
    : null;
  io && io.observe(host);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => driver.resize()) : null;
  ro && ro.observe(host);
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(() => driver.setCap(wantsCap())) : null;
  mo && mo.observe(host, { attributes: true, attributeFilter: ['accessory'] });
  document.addEventListener('visibilitychange', sync);
  reduce && reduce.addEventListener('change', sync);

  return {
    play: (state) => driver.play(state, { reduceMotion: !!(reduce && reduce.matches) }),
    destroy() {
      io && io.disconnect();
      ro && ro.disconnect();
      mo && mo.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduce && reduce.removeEventListener('change', sync);
      driver.destroy();
    },
  };
}

if (typeof window !== 'undefined' && window.PenguinMascot) {
  window.PenguinMascot.registerRenderer('rive', createRiveRenderer);
} else if (typeof window !== 'undefined') {
  console.warn('[penguin-mascot-rive] Hãy nạp penguin.js trước gói này.');
}
