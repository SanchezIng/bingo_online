import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/tesseract.js/dist/worker.min.js',
          dest: 'tesseract',
          rename: { stripBase: true },
        },
        {
          src: 'node_modules/tesseract.js-core/tesseract-core*.{js,wasm}',
          dest: 'tesseract-core',
          rename: { stripBase: true },
        },
      ],
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bingo Digital',
        short_name: 'Bingo',
        description: 'Marca tus cartones de bingo presencial desde el celular',
        lang: 'es',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // OCR está pausado (FEATURES.ocr=false). Los assets de Tesseract
        // (~12 MB) viven en dist/ vía vite-plugin-static-copy pero NO entran
        // al precache. Si OCR se reactiva, runtimeCaching los cachea la
        // primera vez que se piden.
        globIgnores: ['**/tesseract/**', '**/tesseract-core/**'],
        runtimeCaching: [
          {
            urlPattern: /\/tesseract(-core)?\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/tesseract/, /^\/tesseract-core/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: 'hidden',
  },
})
