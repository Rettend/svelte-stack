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
      color: 'violet',
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
  font-family: 'Ubuntu', sans-serif;
}
.bg-primary-gradient {
  background: linear-gradient(to bottom left, hsl(262.1 83.3% 67.5%), hsl(262.1 83.3% 47.5%));
  transition: opacity 0.15s ease-in-out;
  box-shadow: 0 2px 8px 5px hsl(262.1 83.3% 57.8% / 0.2);
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
