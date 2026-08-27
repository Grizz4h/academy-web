import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: 'warn',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 3D viewers (ShowcaseLighting ~900 kB) are intentionally lazy-loaded.
    chunkSizeWarningLimit: 2500,
    reportCompressedSize: false,
  },
})
