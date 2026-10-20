import '@prm393/penguin-mascot';
import { configure } from '@prm393/penguin-mascot-rive';
import riveWasm from '@rive-app/canvas/rive.wasm?url';

// Tự host rive.wasm thay vì tải từ CDN của Rive
configure({ wasmUrl: riveWasm });

const pg = document.getElementById('pg');
const mode = document.getElementById('mode');
const log = document.getElementById('log');

pg.addEventListener('rendererfallback', () => { mode.textContent = 'Renderer: SVG (không nạp được rive/bipbip.riv)'; });
pg.addEventListener('animationdone', (e) => { log.textContent = `xong: ${e.detail.state}`; });

for (const s of customElements.get('penguin-mascot').states) {
  const b = document.createElement('button');
  b.textContent = s;
  b.onclick = () => pg.play(s);
  document.getElementById('buttons').append(b);
}
