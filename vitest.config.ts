import process from 'node:process'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    UnoCSS(),
    svelte({ hot: !process.env.VITEST }),
  ],
  resolve: {
    conditions: ['svelte', 'browser'],
  },
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/.svelte-kit/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '*.{config,setup}.{js,ts,cjs,mjs}',
        '*.config.*.{js,ts,cjs,mjs}',
        'src/lib/components/ui/**/',
        'src/*.*',
        'src/lib/server/**',
        'src/routes/trpc/**',
        'test/**',
      ],
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,svelte}', 'test/**/*.{test,spec}.{js,ts,svelte}'],
    exclude: ['test/e2e/**'],
    alias: {
      '$lib/': new URL('./src/lib/', import.meta.url).pathname,
      '$app/state': new URL('./test/mocks/app-state.ts', import.meta.url).pathname,
      '$app/environment': new URL('./test/mocks/app-environment.ts', import.meta.url).pathname,
      '$env/dynamic/private': new URL('./test/mocks/env.ts', import.meta.url).pathname,
    },
    typecheck: {
      tsconfig: './test/tsconfig.json',
    },
  },
})
