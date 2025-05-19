import type { RequestEvent } from '@sveltejs/kit'

export async function createContext(event: RequestEvent) {
  const session = await event.locals.auth()
  return {
    event,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
