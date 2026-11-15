import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where the dev server forwards /api calls. Docker Compose points this at the backend service;
// the default matches the backend port published on the host.
const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `@/` = src/ (used by the shadcn/ui components)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    // File-change events don't cross a Windows/macOS -> Docker bind mount, so poll there
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
