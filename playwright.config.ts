import process from 'node:process'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  webServer: {
    command: process.env.CI
      ? 'bun run build -- --sourcemap && bun run preview'
      : 'bun run dev',
    url: process.env.CI
      ? 'http://localhost:4173'
      : 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: process.env.CI
      ? 'http://localhost:4173'
      : 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
  ],
})
