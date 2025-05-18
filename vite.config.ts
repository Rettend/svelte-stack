import process from 'node:process'
import { sveltekit } from '@sveltejs/kit/vite'
import extractorSvelte from '@unocss/extractor-svelte'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig({
  plugins: [
    UnoCSS({
      extractors: [extractorSvelte()],
    }),
    sveltekit(),
    istanbul({
      cwd: process.cwd(),
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: [
        'node_modules',
        'test',
        'tests',
        '**/*.{test,spec}.{js,ts,svelte}',
        '**/*.d.ts',
        '.svelte-kit',
        'coverage',
        'dist',
        'build',
        'src/lib/components/ui/**',
        'src/lib/server/**',
        'src/routes/api/**',
        '*.config.{js,ts,cjs,mjs}',
        '*.config.*.{js,ts,cjs,mjs}',
        '**/virtual:',
      ],
      extension: ['.js', '.ts', '.svelte'],
      requireEnv: true,
      forceBuildInstrument: false,
    }),
  ],
  server: {
    fs: {
      // TODO: remove this, only for importing package.json in routes/+page.svelte
      allow: ['.'],
    },
  },
  build: {
    sourcemap: true,
  },
})
