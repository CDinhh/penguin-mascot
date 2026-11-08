// Điều khiển animation của model BipBip 3D: play(state) -> clip cùng tên, trộn mượt, hẹn xong với clip một lần.
// Không import three (nhận LoopOnce/LoopRepeat từ ngoài) để test được bằng Node với mixer giả.
const DONE_SLACK_MS = 400; // chờ thêm sau durationMs, phòng khung hình bị trình duyệt hãm (tab ẩn) thì vẫn xong đúng hẹn

export class MascotDriver {
  /**
   * @param {object} o
   * @param {{ LoopOnce: number, LoopRepeat: number }} o.THREE
   * @param {any} o.mixer      THREE.AnimationMixer của instance
   * @param {any[]} o.clips    THREE.AnimationClip[] (tên clip = tên trạng thái)
   * @param {Record<string, { loop: boolean, durationMs: number }>} o.states  asset.extras.bipbip.states trong file GLB
   * @param {number} [o.fade]  giây trộn giữa hai clip
   */
  constructor({ THREE, mixer, clips, states, fade = 0.2 }) {
    this.THREE = THREE; this.mixer = mixer; this.states = states; this.fade = fade;
    this.actions = new Map();
    for (const c of clips) {
      const a = mixer.clipAction(c);
      if (states[c.name]?.loop) a.setLoop(THREE.LoopRepeat, Infinity);
      else { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      this.actions.set(c.name, a);
    }
    this.base = 'idle'; this.current = null; this.pending = null; this.reduce = false; this.destroyed = false;
    this._onFinished = (e) => { if (this.pending && e.action === this.pending.action) this._finish(); };
    mixer.addEventListener('finished', this._onFinished);
  }

  /** Giảm chuyển động: đứng yên ở tư thế đầu clip, clip một lần xong ngay. */
  setReduceMotion(on) { this.reduce = !!on; if (this.current) this._applyBase(true); }

  _switchTo(action, restart) {
    const prev = this.current;
    if (restart) action.reset();
    action.enabled = true; action.paused = false; action.setEffectiveWeight(1); action.setEffectiveTimeScale(1);
    if (prev && prev !== action) action.crossFadeFrom(prev, this.fade, false);
    action.play();
    this.current = action;
  }

  _applyBase(restart) {
    const a = this.actions.get(this.base) || this.actions.get('idle');
    if (!a) return;
    this._switchTo(a, restart || this.current !== a);
    if (this.reduce) { a.time = 0; a.paused = true; }
  }

  _finish() {
    const p = this.pending;
    if (!p) return;
    clearTimeout(p.timer); this.pending = null;
    if (!this.destroyed) this._applyBase(true);
    p.resolve(p.state);
  }

  /** Trả về Promise: trạng thái lặp resolve ngay, trạng thái một lần resolve khi chạy xong. */
  play(state) {
    if (this.destroyed) return Promise.resolve(state);
    const info = this.states[state];
    if (!info || !this.actions.has(state)) { state = 'idle'; return this.play(state); }
    if (this.pending) this._finish(); // lượt trước bị thay thế
    if (info.loop) { this.base = state; this._applyBase(false); return Promise.resolve(state); }
    if (this.reduce) return Promise.resolve(state);
    const action = this.actions.get(state);
    this._switchTo(action, true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => { if (this.pending && this.pending.action === action) this._finish(); }, info.durationMs + DONE_SLACK_MS + this.fade * 1000);
      this.pending = { state, action, resolve, timer };
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.pending) { clearTimeout(this.pending.timer); const p = this.pending; this.pending = null; p.resolve(p.state); }
    this.mixer.removeEventListener('finished', this._onFinished);
  }
}
