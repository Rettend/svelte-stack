import type { RequestEvent } from '@sveltejs/kit'
import type { inferAsyncReturnType } from '@trpc/server'

export async function createContext(event: RequestEvent) {
  const { locals } = event
  const session = await locals.auth()

  return {
    session,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
