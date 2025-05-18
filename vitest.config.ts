import process from 'node:process'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    conditions: ['svelte', 'browser'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,svelte}', 'test/**/*.{test,spec}.{js,ts,svelte}'],
    alias: {
      '$lib/': new URL('./src/lib/', import.meta.url).pathname,
      '$app/state': new URL('./test/mocks/app-state.ts', import.meta.url).pathname,
    },
  },
})
