import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      injectRegister: 'script-defer',
      outDir: 'build',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 30000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,sqlite,wasm}'],
      },
      manifest: {
        name: 'Mandarin Learner Tool',
        short_name: 'Mandarin Tool',
        description: 'The Mandarin dictionary to help learners',
        theme_color: '#4e46e5',
        background_color: '#eeeeee',
        lang: 'zh',
        icons: [
          {
            src: 'https://cdn.iconscout.com/icon/free/png-256/chinese-language-2646705-2194191.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'https://cdn.iconscout.com/icon/free/png-512/chinese-language-2646705-2194191.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    assetsDir: './',
    minify: true,
    outDir: 'build',
  },
});
