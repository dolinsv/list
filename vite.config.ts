/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base для GitHub Pages: /<repository>/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-192-maskable.png',
        'icons/icon-512-maskable.png',
      ],
      manifest: {
        name: 'Анализ структуры Oriflame',
        short_name: 'Структура',
        description:
          'Локальный анализ информационного листка Oriflame без отправки данных на сервер.',
        lang: 'ru',
        dir: 'ltr',
        start_url: '/list/',
        scope: '/list/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f4f4f5',
        theme_color: '#18181b',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Кэшируем только статику приложения. Данные Excel живут только в памяти React.
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2,webmanifest}'],
        navigateFallback: '/list/index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: '/list/',
  build: {
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
