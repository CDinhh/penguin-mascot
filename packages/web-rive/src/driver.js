// Điều khiển một instance Rive theo spec của BipBip: play(state) -> input của state machine, chờ event `done`.
// Không import thư viện nào (nhận `Rive` và `EventType` từ ngoài) để test được bằng Node với Rive giả.
import { SPEC } from './spec.generated.js';

const DONE_SLACK_MS = 600; // chờ thêm sau durationMs trước khi coi là xong, phòng file .riv quên phát event `done`

export class RiveDriver {
  /**
   * @param {object} o
   * @param {any} o.Rive           lớp Rive của @rive-app/canvas
   * @param {any} o.EventType      EventType của @rive-app/canvas
   * @param {HTMLCanvasElement} o.canvas
   * @param {string} o.src         đường dẫn file .riv
   * @param {string} [o.variant]   mặc định theo spec
   * @param {(err: unknown) => void} [o.onError]  lỗi nạp file (để lùi về SVG)
   * @param {() => void} [o.onReady]
   */
  constructor({ Rive, EventType, canvas, src, variant = SPEC.defaultVariant, onError, onReady }) {
    this.spec = SPEC;
    this.EventType = EventType;
    this.inputs = new Map();
    this.pending = null; // { state, resolve, timer }
    this.pendingState = 'idle'; // trạng thái lặp cần áp dụng khi file nạp xong
    this.ready = false;
    this.destroyed = false;
    this.paused = false;
    this.onError = onError;
    this._onEvent = (e) => {
      const d = e && e.data;
      if (d && d.name === SPEC.rive.doneEvent) this._finish();
    };
    const artboard = SPEC.rive.artboards[variant];
    if (!artboard) throw new Error(`Không có variant "${variant}" trong spec`);
    this.rive = new Rive({
      src, canvas, artboard, stateMachine: SPEC.rive.stateMachine, autoplay: true,
      onLoad: () => {
        if (this.destroyed) return;
        for (const i of this.rive.stateMachineInputs(SPEC.rive.stateMachine) || []) this.inputs.set(i.name, i);
        const missing = this._missingInputs();
        if (missing.length) { this._fail(new Error(`File .riv thiếu input: ${missing.join(', ')}`)); return; }
        this.rive.on(EventType.RiveEvent, this._onEvent);
        this.ready = true;
        this._applyLoop(this.pendingState);
        onReady && onReady();
      },
      onLoadError: (e) => this._fail(e instanceof Error ? e : new Error('Không nạp được file .riv')),
    });
  }

  _missingInputs() {
    const need = new Set();
    for (const s of Object.values(SPEC.states)) need.add(s.riveInput.name);
    return [...need].filter((n) => !this.inputs.has(n));
  }

  _fail(err) {
    if (this.destroyed) return;
    this.destroy();
    this.onError && this.onError(err);
  }

  _applyLoop(state) {
    const s = SPEC.states[state];
    if (!s || !s.loop) return;
    this.inputs.get(s.riveInput.name).value = s.riveInput.value;
  }

  _finish() {
    const p = this.pending;
    if (!p) return;
    clearTimeout(p.timer);
    this.pending = null;
    p.resolve();
  }

  /**
   * Chạy một trạng thái. Trạng thái lặp: đặt `mood`, resolve ngay.
   * Trạng thái một lần: bắn trigger, resolve khi nhận event `done` (hoặc hết durationMs + dư).
   * Gọi lại cùng trạng thái một lần sẽ bắn lại trigger, chạy lại từ đầu.
   * @returns {Promise<void>}
   */
  play(state, { reduceMotion = false } = {}) {
    const s = SPEC.states[state];
    if (!s) return Promise.reject(new Error(`Không có trạng thái "${state}"`));
    if (s.loop) {
      this.pendingState = state;
      if (this.ready) this._applyLoop(state);
      return Promise.resolve();
    }
    // Người dùng chọn giảm chuyển động: đứng yên, vẫn báo xong để app không bị treo chờ.
    if (reduceMotion || !this.ready || this.paused) return Promise.resolve();
    this._finish(); // lượt trước bị lượt này thay thế
    return new Promise((resolve) => {
      const timer = setTimeout(() => { if (this.pending && this.pending.state === state) this._finish(); }, s.durationMs + DONE_SLACK_MS);
      this.pending = { state, resolve, timer };
      this.inputs.get(s.riveInput.name).fire();
    });
  }

  /** Tạm dừng khi khuất màn hình hoặc giảm chuyển động. */
  setPaused(paused) {
    if (this.destroyed || this.paused === paused) return;
    this.paused = paused;
    if (!this.ready) return;
    if (paused) { this.rive.pause(); this._finish(); } else this.rive.play();
  }

  resize() {
    if (!this.destroyed && this.ready) this.rive.resizeDrawingSurfaceToCanvas();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this._finish();
    try { this.rive.off(this.EventType.RiveEvent, this._onEvent); } catch {}
    try { this.rive.cleanup(); } catch {}
  }
}
