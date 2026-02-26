import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { startBackendPlugin } from './vite-plugin-start-backend';

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), startBackendPlugin()],
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    open: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
