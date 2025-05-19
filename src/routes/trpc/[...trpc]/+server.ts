import type { RequestHandler } from '@sveltejs/kit'
import { appRouter } from '$lib/server/trpc/appRouter'
import { createContext } from '$lib/server/trpc/context'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const handler: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createContext(event),
    onError: ({ type, path, error, input, ctx, req }) => {
      console.error(`tRPC Error: ${type} ${path} - ${error.message}`, { input, ctx, req })
    },
  })
}

export const GET = handler
export const POST = handler
