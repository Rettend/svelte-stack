import type { AppRouter } from '$lib/server/trpc'
import type { TRPCClientInit } from 'trpc-sveltekit'
import SuperJSONClass from 'superjson'
import { createTRPCClient } from 'trpc-sveltekit'

let browserClient: ReturnType<typeof createTRPCClient<AppRouter>>

export function trpc(init?: TRPCClientInit) {
  const isBrowser = typeof window !== 'undefined'
  if (isBrowser && browserClient)
    return browserClient
  const client = createTRPCClient<AppRouter>({
    init,
    transformer: {
      input: SuperJSONClass,
      output: SuperJSONClass,
    },
  })
  if (isBrowser)
    browserClient = client
  return client
}
