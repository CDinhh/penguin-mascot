import { createRoot } from 'react-dom/client';
import { RuntimeLoader } from '@rive-app/canvas';
import riveWasm from '@rive-app/canvas/rive.wasm?url';
import { App } from './App';

// Tự host rive.wasm thay vì tải từ CDN của Rive
RuntimeLoader.setWasmUrl(riveWasm);

createRoot(document.getElementById('root')!).render(<App />);
