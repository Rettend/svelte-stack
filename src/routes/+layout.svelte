<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import { session } from '$lib/stores/session'
  import { signIn, signOut } from '@auth/sveltekit/client'
  import { Avatar, AvatarFallback, AvatarImage } from 'bits-ui' // Using bits-ui for shadcn components
  import { onMount } from 'svelte'
  import '@unocss/reset/tailwind.css'
  import 'virtual:uno.css'
  import '@fontsource/ubuntu'

  onMount(async () => {
    const clientSession = await getSession()
    session.set(clientSession)
  })

  // Reactive statement to log session changes (optional, for debugging)
  $effect(() => {
    console.log('Session store changed:', $session)
  })

</script>

<div class='app-container min-h-screen flex flex-col'>
  <nav class='flex items-center justify-between gap-4 bg-card p-4 shadow-md'>
    <a href='/' class='text-xl text-primary font-bold'>Svelte Stack</a>
    <div class='flex items-center gap-4'>
      {#if $session?.user}
        <Avatar class='size-8'>
          <AvatarImage src={$session.user.image ?? undefined} alt={$session.user.name ?? 'User'} />
          <AvatarFallback>{$session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
        </Avatar>
        <span class='text-sm'>Welcome, {$session.user.name ?? $session.user.email}!</span>
        <!-- Client-side sign out -->
        <Button variant='outline' size='sm' on:click={() => signOut()}>Sign Out</Button>

        <!-- Form-based sign out (alternative) -->
        <!--
        <form action="/auth/signout" method="POST" use:enhance>
          <Button type="submit" variant="outline" size="sm">Sign Out</Button>
        </form>
        -->
      {:else if $session === undefined}
        <p class='text-sm text-muted-foreground'>Loading session...</p>
      {:else}
        <!-- Client-side sign in -->
        <Button variant='ghost' size='sm' on:click={() => signIn('github')}>Sign In with GitHub</Button>

        <!-- Link-based sign in (alternative) -->
        <!-- <a href="/auth/signin" class="text-sm">Sign In</a> -->
      {/if}
    </div>
  </nav>
  <main class='flex-grow p-4'>
    <slot />
  </main>
</div>

<style>
  /* You can add global styles here or in a separate app.css if preferred */
  /* The UnoCSS setup handles most styling utilities */
</style>
