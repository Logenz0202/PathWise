import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the dev server forwards /api calls. Docker Compose points this at the backend service;
// the default matches the backend port published on the host.
const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
