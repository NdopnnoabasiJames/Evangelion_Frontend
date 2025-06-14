import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Frontend development server port
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:3031',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path - keep /api prefix as your backend expects it
      },
      // Proxy auth requests to backend
      '/auth': {
        target: 'http://localhost:3031',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Optimize bundle size and chunking
    chunkSizeWarningLimit: 800, // Increase warning limit to 800KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'bootstrap-vendor': ['bootstrap']
        }
      }
    }
  }
})
