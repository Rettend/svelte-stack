import { db } from '$lib/server/db'
import { todos } from '$lib/server/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../t'

export const todosRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const userTodos = await db.query.todos.findMany({
        where: eq(todos.userId, ctx.session.user?.id ?? ''),
        orderBy: [desc(todos.createdAt)],
      })
      return userTodos
    }),

  create: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [newTodo] = await db
        .insert(todos)
        .values({
          text: input.text.trim(),
          userId: ctx.session.user?.id ?? '',
        })
        .returning()
      return newTodo
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedTodo] = await db
        .update(todos)
        .set({ completed: input.completed })
        .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.session.user?.id ?? '')))
        .returning()
      if (!updatedTodo)
        throw new Error('Todo not found or user unauthorized')

      return updatedTodo
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deletedTodo] = await db
        .delete(todos)
        .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.session.user?.id ?? '')))
        .returning()
      if (!deletedTodo)
        throw new Error('Todo not found or user unauthorized')

      return { id: input.id }
    }),
})
