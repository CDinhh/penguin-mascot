import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để dist mở được từ thư mục con (và từ máy chủ tĩnh đơn giản dùng trong test)
export default defineConfig({ base: './', plugins: [react()] });
