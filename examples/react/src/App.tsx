import { useState } from 'react';
import { MASCOT_STATES, MASCOT_STATE_NAMES, PenguinMascot, type MascotState } from '@prm393/penguin-mascot-react';

export function App() {
  const [state, setState] = useState<MascotState>('idle');
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [mode, setMode] = useState('đang nạp Rive...');
  const [log, setLog] = useState<string[]>([]);

  const pick = (s: MascotState) => { setState(s); setReplay((n) => n + 1); };

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '24px auto', padding: '0 16px' }}>
      <h1>BipBip, ví dụ React</h1>
      <p data-testid="mode">Renderer: {mode}</p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <PenguinMascot
          state={state}
          size={220}
          replayKey={replay}
          reducedMotion={reduced}
          onDone={(s) => setLog((l) => [`xong: ${s}`, ...l].slice(0, 6))}
          onFallback={() => setMode('web component (không nạp được rive/bipbip.riv)')}
        />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MASCOT_STATE_NAMES.map((s) => (
              <button key={s} onClick={() => pick(s)} aria-pressed={s === state}>
                {s}{MASCOT_STATES[s].loop ? ' (lặp)' : ''}
              </button>
            ))}
          </div>
          <p>
            <label><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> Giảm chuyển động</label>
          </p>
          <p data-testid="log">{log.join(' | ') || 'chưa có animation nào xong'}</p>
        </div>
      </div>
    </main>
  );
}
