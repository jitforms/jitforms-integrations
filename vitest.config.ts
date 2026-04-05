import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/*/tests/**/*.test.ts', 'packages/*/tests/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@jitforms/js': path.resolve(__dirname, 'packages/js/src'),
      '@jitforms/react': path.resolve(__dirname, 'packages/react/src'),
      '@jitforms/vue': path.resolve(__dirname, 'packages/vue/src'),
      '@jitforms/svelte': path.resolve(__dirname, 'packages/svelte/src'),
      '@jitforms/angular': path.resolve(__dirname, 'packages/angular/src'),
      '@jitforms/astro': path.resolve(__dirname, 'packages/astro/src'),
      '@jitforms/next': path.resolve(__dirname, 'packages/next/src'),
    },
  },
});
