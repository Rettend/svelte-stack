import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerAttributifyJsx,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAnimations(),
    presetTypography(),
    presetAttributify(),
    presetShadcn({
      color: 'blue',
    }),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerAttributifyJsx(),
    transformerVariantGroup(),
  ],
  preflights: [
    {
      getCSS: () => {
        return `html {
  padding: 0;
  margin: 0;
  scroll-behavior: smooth;
}
body {
  padding: 0;
  margin: 0;
  height: 100dvh;
  width: 100dvw;
  overflow-x: hidden;
  font-family: 'Berkshire Swash', cursive;
}
.bg-primary-gradient {
  background: linear-gradient(to bottom left, hsl(221.2 83.2% 63.0%), hsl(221.2 83.2% 43.0%));
  transition: opacity 0.15s ease-in-out;
  box-shadow: 0 2px 8px 5px hsl(221.2 83.2% 53.3% / 0.2);
  text-shadow: 0 2px 2px hsl(210 40% 98% / 0.2);
}
.bg-primary-gradient:hover {
  opacity: 0.85;
}
`
      },
    },
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'src/**/*.{js,ts}',
      ],
    },
  },
})
