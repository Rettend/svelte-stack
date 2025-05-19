import type { Context } from './context'
import { initTRPC, TRPCError } from '@trpc/server'

export const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id)
    throw new TRPCError({ code: 'UNAUTHORIZED' })

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthenticated)

// TODO: do we still need this?
// Removed: import todosRouter and appRouter definition to break circular dependency
// import { todosRouter } from './routers/todos'
// export const appRouter = router({ todos: todosRouter })
// export type AppRouter = typeof appRouter
