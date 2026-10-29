import { defineConfig } from 'vite';

// base: './' makes every asset path relative, so the same build works at
// https://<user>.github.io/electrolyte-wetting/ and in a local preview.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['tests/**/*.test.js'],
    testTimeout: 120000,
  },
});
