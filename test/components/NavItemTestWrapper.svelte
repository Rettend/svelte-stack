<script lang='ts'>
  import type { HTMLAnchorAttributes } from 'svelte/elements'
  import NavItem from '$lib/components/NavItem.svelte'

  type Props = {
    href: string
    textContent: string
    consumerClass?: string
    target?: HTMLAnchorAttributes['target']
    rel?: HTMLAnchorAttributes['rel']
  }

  const { href, textContent, consumerClass, target, rel }: Props = $props()

</script>

{#snippet dynamicChildren()}
  {textContent}
{/snippet}

<NavItem
  {href}
  children={dynamicChildren}
  class={consumerClass}
  {target}
  {rel}
/>
