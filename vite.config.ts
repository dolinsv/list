/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base для GitHub Pages: /<repository>/
export default defineConfig({
  plugins: [react()],
  base: '/list/',
  build: {
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
