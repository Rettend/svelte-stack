import type { Handle } from '@sveltejs/kit'
import { handle as authHandle } from './auth'

export const handle: Handle = async ({ event, resolve }) => {
  console.log('event.platform.env in hooks.server.ts:', event.platform?.env)

  // You can also specifically check for AUTH_SECRET here
  if (event.platform?.env)
    console.log('AUTH_SECRET in event.platform.env:', event.platform.env.AUTH_SECRET)
  else
    console.log('event.platform or event.platform.env is undefined in hooks.server.ts')

  return authHandle({ event, resolve })
}
