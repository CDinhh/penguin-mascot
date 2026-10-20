// Điều khiển một instance Rive theo spec của BipBip: play(state) -> property của view model `Mascot`, chờ state machine về trạng thái lặp.
// Không import thư viện nào (nhận `Rive` và `EventType` từ ngoài) để test được bằng Node với Rive giả.
import { SPEC } from './spec.generated.js';

const DONE_SLACK_MS = 600; // chờ thêm sau durationMs trước khi coi là xong, phòng không nhận được thay đổi state của state machine

export class RiveDriver {
  /**
   * @param {object} o
   * @param {any} o.Rive           lớp Rive của @rive-app/canvas
   * @param {any} o.EventType      EventType của @rive-app/canvas (dùng StateChange)
   * @param {HTMLCanvasElement} o.canvas
   * @param {string} o.src         đường dẫn file .riv
   * @param {string} [o.variant]   mặc định theo spec
   * @param {boolean} [o.cap]      đội mũ tốt nghiệp (property `cap` của view model), mặc định không
   * @param {(err: unknown) => void} [o.onError]  lỗi nạp file (để lùi về SVG)
   * @param {() => void} [o.onReady]
   */
  constructor({ Rive, EventType, canvas, src, variant = SPEC.defaultVariant, cap = false, onError, onReady }) {
    this.spec = SPEC;
    this.EventType = EventType;
    this.inputs = new Map(); // property của view model: number có .value, trigger có .trigger()
    this.cap = cap;
    this.pending = null; // { state, resolve, timer, started }
    this.pendingState = 'idle'; // trạng thái lặp cần áp dụng khi file nạp xong
    this.ready = false;
    this.destroyed = false;
    this.paused = false;
    this.onError = onError;
    // Xong một lần = state machine rời state của trạng thái đó và về một state lặp (spec.rive.doneStates)
    this._onState = (e) => {
      const p = this.pending;
      const names = (e && e.data) || [];
      if (!p) return;
      if (names.includes(p.state)) p.started = true;
      if (p.started && names.some((n) => SPEC.rive.doneStates.includes(n))) this._finish();
    };
    const artboard = SPEC.rive.artboards[variant];
    if (!artboard) throw new Error(`Không có variant "${variant}" trong spec`);
    this.rive = new Rive({
      src, canvas, artboard, stateMachine: SPEC.rive.stateMachine, autoplay: true, autoBind: true,
      onLoad: () => {
        if (this.destroyed) return;
        const vmi = this.rive.viewModelInstance;
        if (!vmi) { this._fail(new Error(`File .riv không có view model "${SPEC.rive.viewModel}" gắn vào artboard`)); return; }
        for (const s of Object.values(SPEC.states)) {
          const { type, name } = s.riveInput;
          const prop = type === 'number' ? vmi.number(name) : vmi.trigger(name);
          if (prop) this.inputs.set(name, prop);
        }
        const missing = this._missingInputs();
        if (missing.length) { this._fail(new Error(`File .riv thiếu input: ${missing.join(', ')}`)); return; }
        this.capProp = vmi.boolean(SPEC.rive.capInput.name);
        this.setCap(this.cap);
        this.rive.on(EventType.StateChange, this._onState);
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

  /** Đội hoặc bỏ mũ tốt nghiệp. Nhớ lại để áp dụng sau khi file nạp xong. */
  setCap(on) {
    this.cap = !!on;
    if (this.capProp) this.capProp.value = this.cap;
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
   * Trạng thái một lần: bắn trigger, resolve khi state machine về state lặp (hoặc hết durationMs + dư).
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
      this.pending = { state, resolve, timer, started: false };
      this.inputs.get(s.riveInput.name).trigger();
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
    try { this.rive.off(this.EventType.StateChange, this._onState); } catch {}
    try { this.rive.cleanup(); } catch {}
  }
}
