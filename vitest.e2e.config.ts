import { defineConfig, mergeConfig } from 'vitest/config';
import vitestConfig from './vitest.config.ts';

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      include: ['**/*.e2e-test.ts'],
      environment: './prisma/vitest-environment-prisma/prisma-test-environment.ts',
    },
  })
);
