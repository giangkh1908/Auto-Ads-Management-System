import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'sonner'],
          'vendor-utils': ['axios', 'i18next', 'react-i18next'],
          'vendor-maps': ['mapbox-gl', 'react-map-gl'],
          'vendor-charts': ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
