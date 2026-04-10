import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Build into the Flask project so Render can serve it.
    outDir: '../ui_dist',
    emptyOutDir: true,
  },
  server: {
    // Local dev only: let the UI call the Flask API without CORS.
    proxy: {
      // Only proxy API — SPA routes like /attendance must stay on Vite.
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
