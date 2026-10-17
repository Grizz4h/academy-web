import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  logLevel: 'warn',
  server: {
    fs: {
      // Style Lab reads Track 0 foundation JSON from repo data/ (read-only).
      allow: [repoRoot],
    },
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
