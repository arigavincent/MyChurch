import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: '../backend/public/admin',
    emptyOutDir: true,
  },
});
