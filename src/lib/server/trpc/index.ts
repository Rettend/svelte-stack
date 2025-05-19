import { todosRouter } from './routers/todos'
import { router } from './t'

export const appRouter = router({
  todos: todosRouter,
})

export type AppRouter = typeof appRouter
