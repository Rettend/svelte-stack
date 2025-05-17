<script lang='ts'>
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'
  import { signIn } from '@auth/sveltekit/client'

  const email = page.url.searchParams.get('email')
  const providerToLinkFromUrl = page.url.searchParams.get('providerToLink')

  const otherProviders: { id: string, name: string, icon: string }[] = []
  if (providerToLinkFromUrl !== 'github')
    otherProviders.push({ id: 'github', name: 'GitHub', icon: 'i-ph:github-logo-bold' })

  if (providerToLinkFromUrl !== 'google')
    otherProviders.push({ id: 'google', name: 'Google', icon: 'i-ph:google-logo-bold' })

</script>

<div class='mx-auto mt-8 max-w-md border rounded-lg bg-card p-6 text-card-foreground shadow-lg container'>
  <h1 class='mb-4 text-2xl font-semibold'>Link Your Account</h1>
  {#if email && providerToLinkFromUrl}
    <p class='mb-2'>
      An account with the email <strong>{email}</strong> already exists.
    </p>
    <p class='mb-4'>
      To connect your <strong>{(providerToLinkFromUrl || '').charAt(0).toUpperCase() + (providerToLinkFromUrl || '').slice(1)}</strong> account,
      please first sign in with the provider you originally used for this email.
    </p>

    {#if otherProviders.length > 0}
      <p class='mb-2'>Sign in with:</p>
      <div class='flex flex-col space-y-3'>
        {#each otherProviders as provider}
          <Button
            variant='outline'
            class='m-a w-fit'
            onclick={() => signIn(provider.id, { callbackUrl: `/auth/finalize-link?providerToLink=${providerToLinkFromUrl}` })}
          >
            <span class={`${provider.icon} mr-2 size-5`}></span>
            Link {provider.name}
          </Button>
        {/each}
      </div>
    {:else}
      <p class='text-sm text-muted-foreground'>
        Please try signing in with your original account.
      </p>
    {/if}
  {/if}

  <hr class='my-6' />

  <a href='/' class='text-sm text-primary hover:underline'>
    Cancel and go back to homepage
  </a>
</div>
