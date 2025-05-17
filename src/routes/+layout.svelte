<script lang='ts'>
  import { page } from '$app/state'
  import NavItem from '$lib/components/NavItem.svelte'
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar'
  import { Button } from '$lib/components/ui/button'
  import { session } from '$lib/stores/session.svelte'
  import { signIn, signOut } from '@auth/sveltekit/client'
  import { onMount } from 'svelte'
  import '@unocss/reset/tailwind.css'
  import 'virtual:uno.css'
  import '@fontsource/ubuntu'

  onMount(async () => {
    session.current = page.data.session
  })
</script>

<div class='app-container min-h-screen flex flex-col bg-background text-foreground'>
  <header class='m-a mt-4 w-fit flex flex-col items-center gap-4 border border-primary/20 rounded-lg bg-card p-6'>
    <a href='/' class='flex items-center gap-2 text-3xl text-primary font-bold'>
      <span class='i-solar:star-bold size-8'></span>
      Svelte Stack
    </a>
    <div class='flex items-center gap-3'>
      <NavItem href='/'>Home</NavItem>
      <NavItem href='/todos'>Todos</NavItem>
    </div>
    <div class='flex items-center gap-3'>
      {#if session.current?.user}
        <Avatar class='size-9'>
          <AvatarImage src={session.current.user.image ?? undefined} alt={session.current.user.name ?? 'User'} />
          <AvatarFallback>{session.current.user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
        </Avatar>
        <span class='font-medium'>{session.current.user.name ?? session.current.user.email}</span>
        <Button variant='outline' size='sm' onclick={() => signOut()}>Sign Out</Button>
      {:else if session.current === undefined}
        <p class='text-sm text-muted-foreground'>Loading session...</p>
      {:else}
        <Button variant='outline' size='sm' onclick={() => signIn('github')}>
          <span class='i-ph:github-logo-bold mr-2 size-5'></span>
          Log in with GitHub
        </Button>
        <Button variant='outline' size='sm' onclick={() => signIn('google')}>
          <span class='i-ph:google-logo-bold mr-2 size-5'></span>
          Log in with Google
        </Button>
      {/if}
    </div>
  </header>
  <main class='flex flex-grow flex-col items-center p-4'>
    <slot />
  </main>
</div>
