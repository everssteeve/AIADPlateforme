import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    globals: false,
    testTimeout: 30_000,
    include: ['tests/**/*.test.ts'],
  },
}))
