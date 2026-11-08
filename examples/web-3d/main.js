import '@prm393/penguin-mascot';
import '@prm393/penguin-mascot-3d';

const pg = document.getElementById('pg');
const mode = document.getElementById('mode');
const log = document.getElementById('log');

mode.textContent = 'Renderer: 3D (three.js)';
pg.addEventListener('rendererfallback', () => { mode.textContent = 'Renderer: SVG (không dùng được 3D)'; });
pg.addEventListener('animationdone', (e) => { log.textContent = `xong: ${e.detail.state}`; });
document.getElementById('cap').onchange = (e) => (e.target.checked ? pg.setAttribute('accessory', 'cap') : pg.removeAttribute('accessory'));

for (const s of customElements.get('penguin-mascot').states) {
  const b = document.createElement('button');
  b.textContent = s;
  b.onclick = () => pg.play(s);
  document.getElementById('buttons').append(b);
}
