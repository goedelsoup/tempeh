import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@tempeh/cli': resolve(__dirname, './packages/cli/src/index.ts'),
      '@tempeh/core': resolve(__dirname, './packages/core/src/index.ts'),
      '@tempeh/state': resolve(__dirname, './packages/state/src/index.ts'),
      '@tempeh/utils': resolve(__dirname, './packages/utils/src/index.ts'),
      '@tempeh/types': resolve(__dirname, './packages/types/src/index.ts')
    }
  }
});
