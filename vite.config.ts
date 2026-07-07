import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/project45/',
  root: 'app',
  plugins: [react()],
  publicDir: '../public',
  build: {
    outDir: '../dist/project45',
    emptyOutDir: true,
  },
});
