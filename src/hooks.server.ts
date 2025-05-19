import { handle as authHandle } from '$lib/server/auth'
import { appRouter } from '$lib/server/trpc'
import { createContext } from '$lib/server/trpc/context'
import { sequence } from '@sveltejs/kit/hooks'
import { createTRPCHandle } from 'trpc-sveltekit'

const trpcServerHandle = createTRPCHandle({
  router: appRouter,
  createContext,
})

export const handle = sequence(authHandle, trpcServerHandle)
