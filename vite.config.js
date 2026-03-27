import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'ui',
  plugins: [
    tailwindcss(),
    react(),
    viteSingleFile(),
  ],
  build: {
    outDir: '../build',
    emptyOutDir: true,
  },
});
