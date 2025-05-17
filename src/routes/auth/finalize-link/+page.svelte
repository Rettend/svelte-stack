<script lang='ts'>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { signIn } from '@auth/sveltekit/client'
  import { onMount } from 'svelte'

  let message = 'Finalizing account linking, please wait...'

  onMount(async () => {
    console.log('[finalize-link] Page mounted.') // DEBUG
    const providerToLink = page.url.searchParams.get('providerToLink')
    console.log('[finalize-link] providerToLink from URL:', providerToLink) // DEBUG

    if (providerToLink) {
      try {
        console.log(`[finalize-link] Attempting signIn('${providerToLink}')...`) // DEBUG
        const result = await signIn(providerToLink, { redirect: false })
        console.log('[finalize-link] signIn result:', result) // DEBUG

        if (result?.ok && !result.error) {
          message = 'Account linked successfully! Redirecting...'
          await goto('/', { replaceState: true })
        }
        else if (result?.error) {
          console.error('[finalize-link] Error during signIn:', result.error)
          message = `Failed to link account: ${result.error}. Please try again or contact support.`
        }
        else if (!result?.ok) {
          console.log('[finalize-link] signIn result was not ok but no explicit error.')
          message = 'There was an issue linking your account. Please try again.'
        }
      }
      catch (error) {
        console.error('[finalize-link] Exception during signIn attempt:', error)
        message = 'An unexpected error occurred while linking your account.'
      }
    }
    else {
      console.log('[finalize-link] providerToLink not found in URL.')
      message = 'Provider to link not specified. Cannot finalize linking.'
    }
  })
</script>

<div class='mx-auto mt-10 max-w-md p-6 text-center container'>
  <h1 class='mb-4 text-xl font-semibold'>Account Linking</h1>
  <p>{message}</p>
  {#if message.startsWith('Failed') || message.startsWith('Provider to link not specified')}
    <a href='/' class='mt-4 inline-block text-primary hover:underline'>Go to Homepage</a>
  {/if}
</div>
