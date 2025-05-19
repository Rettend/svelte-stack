import type { Context } from '$lib/server/trpc/context'
import { initTRPC, TRPCError } from '@trpc/server'
import SuperJSON from 'superjson'

const t = initTRPC.context<Context>().create({
  transformer: {
    input: SuperJSON,
    output: SuperJSON,
  },
  errorFormatter({ shape }) {
    return shape
  },
})

export const router = t.router

export const publicProcedure = t.procedure

export const middleware = t.middleware

export const mergeRouters = t.mergeRouters

const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user)
    throw new TRPCError({ code: 'UNAUTHORIZED' })

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthenticated)
