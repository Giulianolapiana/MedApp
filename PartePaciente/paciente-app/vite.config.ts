import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js (escena 3D del hero) va en un chunk aparte cargado con React.lazy;
    // pesa ~540 kB sin comprimir (~135 kB gzip) y no bloquea la primera pintura.
    chunkSizeWarningLimit: 600,
  },
})
