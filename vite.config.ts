import { sveltekit } from '@sveltejs/kit/vite'
import extractorSvelte from '@unocss/extractor-svelte'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig(() => {
  return {
    plugins: [
      UnoCSS({
        extractors: [extractorSvelte()],
      }),
      sveltekit(),
    ],
    server: {
      fs: {
        // TODO: remove this, only for importing package.json in routes/+page.svelte
        allow: ['.'],
      },
    },
  }
})
