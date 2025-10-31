import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    exclude: [
      'build/**',
      'dist/**',
      'node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'build/**',
        'dist/**',
        'src/generated/**',
        '**/*.test.ts',
        '**/*.e2e-test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/schemas.ts',
      ],
    },
  },
});
