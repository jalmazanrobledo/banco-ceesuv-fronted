import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Desactiva el empaquetador experimental Rolldown y usa Rollup estándar
    rolldown: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})