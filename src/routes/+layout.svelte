<script lang='ts'>
  import { page } from '$app/state'
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar'
  import { Button } from '$lib/components/ui/button'
  import { session } from '$lib/stores/session'
  import { signIn, signOut } from '@auth/sveltekit/client'
  import { onMount } from 'svelte'
  import '@unocss/reset/tailwind.css'
  import 'virtual:uno.css'
  import '@fontsource/ubuntu'

  onMount(async () => {
    session.set(page.data.session)
  })
</script>

<div class='app-container min-h-screen flex flex-col bg-background text-foreground'>
  <header class='flex flex-col items-center gap-4 bg-card p-6'>
    <a href='/' class='flex items-center gap-2 text-3xl text-primary font-bold'>
      <span class='i-solar:star-bold size-8'></span>
      Svelte Stack
    </a>
    <div class='flex items-center gap-3'>
      {#if $session?.user}
        <Avatar class='size-9'>
          <AvatarImage src={$session.user.image ?? undefined} alt={$session.user.name ?? 'User'} />
          <AvatarFallback>{$session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
        </Avatar>
        <span class='font-medium'>{$session.user.name ?? $session.user.email}</span>
        <Button variant='outline' size='sm' onclick={() => signOut()}>Sign Out</Button>
      {:else if $session === undefined}
        <p class='text-sm text-muted-foreground'>Loading session...</p>
      {:else}
        <Button variant='outline' size='sm' onclick={() => signIn('github')}>
          <span class='i-ph:github-logo-bold mr-2 size-5'></span>
          Login with GitHub
        </Button>
      {/if}
    </div>
  </header>
  <main class='flex flex-grow flex-col items-center p-4'>
    <slot />
  </main>
</div>
