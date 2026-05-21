import path from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    globals: false,
    testTimeout: 30_000,
    include: ['tests/**/*.test.ts'],
  },
}))
