<script lang='ts'>
  import type { ClassValue } from 'tailwind-variants'
  import type { Events, Props } from './index.js'
  import { cn } from '$lib/utils'
  import { Button as ButtonPrimitive } from 'bits-ui'
  import { buttonVariants } from './index.js'

  type $$Props = Props & { class: ClassValue }
  type $$Events = Events

  let className: $$Props['class']
  export let variant: $$Props['variant'] = 'default'
  export let size: $$Props['size'] = 'default'
  export let builders: $$Props['builders'] = []
  export { className as class }
</script>

<ButtonPrimitive.Root
  {builders}
  class={cn(buttonVariants({ variant, size, className }))}
  type='button'
  {...$$restProps}
  on:click
  on:keydown
>
  <slot />
</ButtonPrimitive.Root>
