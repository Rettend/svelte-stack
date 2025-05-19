import { router } from './router'
import { todosRouter } from './routers/todos'

export const appRouter = router({
  todos: todosRouter,
})

export type AppRouter = typeof appRouter
