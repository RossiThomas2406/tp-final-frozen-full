import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true // abre el navegador automáticamente
  },
  build: {
    outDir: 'dist',
    sourcemap: false // desactiva sourcemaps para producción
  }
})