import { createElement, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { EventType, type StateMachineInput } from '@rive-app/canvas';
import '@prm393/penguin-mascot';
import { DEFAULT_VARIANT, MASCOT_STATES, RIVE, type MascotState, type MascotVariant } from './states';

/** Chờ thêm sau durationMs trước khi coi là xong, phòng file .riv quên phát event `done`. */
const DONE_SLACK_MS = 600;

export interface PenguinMascotProps {
  /** Trạng thái hiện tại. Đổi prop để đổi animation. */
  state?: MascotState;
  /** Chiều rộng (px hoặc chuỗi CSS), mặc định 200. */
  size?: number | string;
  variant?: MascotVariant;
  /** Gọi khi animation một lần chạy xong (hoặc bị bỏ qua vì giảm chuyển động). */
  onDone?: (state: MascotState) => void;
  /** Đổi giá trị này để phát lại đúng trạng thái một lần đang chọn (ví dụ trả lời sai hai lần liền). */
  replayKey?: number | string;
  /** Đường dẫn file .riv, mặc định theo spec (`rive/bipbip.riv`, tương đối với trang). */
  src?: string;
  /** Ép giảm chuyển động; mặc định theo `prefers-reduced-motion` của hệ điều hành. */
  reducedMotion?: boolean;
  /** Gọi khi không dùng được Rive và đã lùi về web component `<penguin-mascot>`. */
  onFallback?: (error: unknown) => void;
  className?: string;
  style?: CSSProperties;
}

function useReducedMotion(force?: boolean): boolean {
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return force ?? reduced;
}

/**
 * BipBip bằng Rive; không nạp được file .riv (thiếu, hỏng, thiếu input theo spec) thì lùi về `<penguin-mascot>`.
 * API giống web component: `state`, `size`, `variant`, `onDone`.
 */
export function PenguinMascot({
  state = 'idle', size = 200, variant = DEFAULT_VARIANT, onDone, replayKey, src = RIVE.file, reducedMotion, onFallback, className, style,
}: PenguinMascotProps) {
  const reduced = useReducedMotion(reducedMotion);
  const [failed, setFailed] = useState(false);
  const fail = useCallback((err: unknown) => { setFailed(true); onFallbackRef.current?.(err); }, []);
  const onDoneRef = useRef(onDone);
  const onFallbackRef = useRef(onFallback);
  onDoneRef.current = onDone;
  onFallbackRef.current = onFallback;

  const artboard = (RIVE.artboards as Record<string, string>)[variant];
  const { rive, RiveComponent } = useRive(
    failed ? null : { src, artboard, stateMachine: RIVE.stateMachine, autoplay: true, onLoadError: () => fail(new Error('Không nạp được file .riv')) },
    { shouldUseIntersectionObserver: true },
  );

  // Input của state machine, kiểm tra đủ theo spec ngay khi file nạp xong
  const inputs = useRef(new Map<string, StateMachineInput>());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!rive) return;
    inputs.current = new Map((rive.stateMachineInputs(RIVE.stateMachine) ?? []).map((i) => [i.name, i]));
    const missing = [...new Set(Object.values(MASCOT_STATES).map((s) => s.riveInput.name))].filter((n) => !inputs.current.has(n));
    if (missing.length) { fail(new Error(`File .riv thiếu input: ${missing.join(', ')}`)); return; }
    setReady(true);
    return () => setReady(false);
  }, [rive, fail]);

  // Event `done` do state machine phát khi animation một lần xong
  const pending = useRef<{ state: MascotState; timer: ReturnType<typeof setTimeout> } | null>(null);
  const finish = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    onDoneRef.current?.(p.state);
  }, []);
  useEffect(() => {
    if (!rive || !ready) return;
    const handler = (e: { data?: unknown }) => {
      if ((e.data as { name?: string } | undefined)?.name === RIVE.doneEvent) finish();
    };
    rive.on(EventType.RiveEvent, handler);
    return () => { rive.off(EventType.RiveEvent, handler); finish(); };
  }, [rive, ready, finish]);

  // Áp dụng trạng thái: lặp -> mood; một lần -> bắn trigger (đổi replayKey để chạy lại cùng trạng thái)
  useEffect(() => {
    if (!rive || !ready) return;
    const info = MASCOT_STATES[state];
    const input = inputs.current.get(info.riveInput.name);
    if (!input) return;
    if (info.riveInput.type === 'number') { input.value = info.riveInput.value; return; }
    if (reduced) { queueMicrotask(() => onDoneRef.current?.(state)); return; }
    finish(); // lượt trước bị thay thế
    pending.current = { state, timer: setTimeout(finish, info.durationMs + DONE_SLACK_MS) };
    input.fire();
  }, [rive, ready, state, replayKey, reduced, finish]);

  // Giảm chuyển động: đứng yên. Khuất màn hình thì useRive tự dừng (IntersectionObserver).
  useEffect(() => {
    if (!rive || !ready) return;
    if (reduced) rive.pause(); else rive.play();
  }, [rive, ready, reduced]);

  const box: CSSProperties = { width: size, aspectRatio: '200 / 240', lineHeight: 0, ...style };

  if (failed) {
    return <WebComponentFallback state={state} size={size} variant={variant} replayKey={replayKey} onDone={onDone} className={className} style={style} />;
  }
  return (
    <div className={className} style={box} role="img" aria-label="BipBip">
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

type FallbackProps = Pick<PenguinMascotProps, 'state' | 'size' | 'variant' | 'replayKey' | 'onDone' | 'className' | 'style'>;

interface MascotElement extends HTMLElement { play(state: string): Promise<string> }

/** Đường lùi: web component zero-dependency, cùng API. */
function WebComponentFallback({ state = 'idle', size, variant, replayKey, onDone, className, style }: FallbackProps) {
  const ref = useRef<MascotElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => onDoneRef.current?.((e as CustomEvent<{ state: MascotState }>).detail.state);
    el.addEventListener('animationdone', handler);
    return () => el.removeEventListener('animationdone', handler);
  }, []);

  // Đổi state hoặc replayKey đều gọi play(): chạy lại cùng trạng thái một lần phải phát lại
  useEffect(() => { ref.current?.play?.(state); }, [state, replayKey]);

  return createElement('penguin-mascot', { ref, class: className, style, state, size: String(size), variant });
}
