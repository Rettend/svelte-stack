import type { AppRouter } from '$lib/server/trpc/appRouter'
import process from 'node:process'
import { createTRPCClient, httpBatchLink } from '@trpc/client'

function getBaseUrl() {
  if (typeof window !== 'undefined')
    return ''
  return `http://localhost:${process.env.PORT ?? 5173}`
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
})
