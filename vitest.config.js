import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**'],
  },
});
