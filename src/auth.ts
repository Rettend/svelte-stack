import { env } from '$env/dynamic/private'
import { SvelteKitAuth } from '@auth/sveltekit'
import GitHub from '@auth/sveltekit/providers/github'

console.log('AUTH_SECRET', env.AUTH_SECRET)

export const { handle } = SvelteKitAuth({
  providers: [GitHub],
  trustHost: true,
  secret: env.AUTH_SECRET,
})
