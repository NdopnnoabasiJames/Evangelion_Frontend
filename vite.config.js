import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Frontend development server port
    proxy: {
      // Proxy API requests to backend in development only
      '/api': {
        target: 'http://localhost:3031',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path - keep /api prefix as your backend expects it
      },
      // Proxy auth requests to backend in development only
      '/auth': {
        target: 'http://localhost:3031',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Optimize bundle size and chunking
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000KB (1MB) for admin dashboards
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'bootstrap-vendor': ['bootstrap'],
          // Separate admin components and services
          'admin-vendor': ['src/services/analyticsService.js', 'src/services/systemMetricsService.js']
        }
      }
    },
    // Enable source maps for better debugging
    sourcemap: false, // Disable in production for smaller bundles
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  }
})
