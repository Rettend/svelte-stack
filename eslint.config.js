import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  svelte: true,
  rules: {
    "no-console": 'warn',
  },
})
