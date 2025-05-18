import process from 'node:process'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
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
        'src/app.d.ts',
        'src/hooks.server.ts',
        'src/lib/components/ui/**/',
        'src/lib/server/db/index.ts',
        'src/lib/server/db/schema.ts',
        'src/lib/server/auth.ts',
        'src/lib/github.ts',
        'src/routes/+layout.ts',
        'test/**',
      ],
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,svelte}', 'test/**/*.{test,spec}.{js,ts,svelte}'],
    alias: {
      '$lib/': new URL('./src/lib/', import.meta.url).pathname,
      '$app/state': new URL('./test/mocks/app-state.ts', import.meta.url).pathname,
    },
    typecheck: {
      tsconfig: './test/tsconfig.json',
    },
  },
})
