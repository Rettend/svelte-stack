<script lang='ts'>
  import type { Snippet } from 'svelte'
  import type { HTMLAnchorAttributes } from 'svelte/elements'
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'

  type Props = {
    href: string
    children: Snippet
    class?: string
    target?: HTMLAnchorAttributes['target']
    rel?: HTMLAnchorAttributes['rel']
  }

  const { href, children, class: consumerClass, target, rel }: Props = $props()

  const isActive = $derived(page.url.pathname === href)
</script>

<Button
  {href}
  {target}
  {rel}
  variant='ghost'
  class={`text-lg font-bold hover:(bg-primary/10 text-primary) ${isActive ? 'text-primary bg-primary/5' : ''} ${consumerClass ?? ''.trim()}`}
>
  {@render children()}
</Button>
