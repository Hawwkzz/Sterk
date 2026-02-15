import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'EOIA Energie - Suivi Production',
        short_name: 'EOIA Energie',
        description: 'Application de suivi des installations LED',
        theme_color: '#f97316',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // CRITICAL: Route toutes les navigations internes vers index.html
        navigateFallback: '/index.html',
        // CRITICAL: Exclure les URLs externes du service worker
        // Cela empêche le SW d'intercepter les navigations vers Supabase, etc.
        navigateFallbackDenylist: [
          /^\/api/,
          /supabase\.co/,
          /supabase\.in/,
          // Exclure toute URL qui n'est pas une route de l'app
          /\.\w+$/,  // Fichiers avec extension (.pdf, .jpg, etc.)
        ],
        // Ne PAS cacher les requêtes API ou storage Supabase
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Supabase API & Storage - TOUJOURS réseau, jamais cache
            urlPattern: /^https:\/\/.*\.supabase\.(co|in)\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
