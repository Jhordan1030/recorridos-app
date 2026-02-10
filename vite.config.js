import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Recorridos',
        short_name: 'Recorridos',
        description: 'App de recorridos en tiempo real',
        theme_color: '#0d6efd',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: '/pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp'
          },
          {
            src: '/pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['jspdf', 'jspdf-autotable'],
          utils: ['axios', 'html2canvas']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/index.css',
        './src/components/layout/Layout.jsx'
      ]
    }
  }
})
