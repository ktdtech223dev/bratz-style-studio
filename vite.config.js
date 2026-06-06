import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
      },
      manifest: {
        name: 'Us',
        short_name: 'Us',
        description: 'just us',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1f4a',
        theme_color: '#1a1f4a',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/photos': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  build: {
    outDir: 'dist',
  },
});
