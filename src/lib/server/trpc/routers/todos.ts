import { db } from '$lib/server/db'
import { todos } from '$lib/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../router'

export const todosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.query.todos.findMany({
      where: eq(todos.userId, ctx.user.id!),
      orderBy: (todosTable, { desc }) => [desc(todosTable.createdAt)],
    })
  }),
  create: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [newTodo] = await db
        .insert(todos)
        .values({
          text: input.text.trim(),
          userId: ctx.user.id!,
        })
        .returning()
      return newTodo
    }),
  update: protectedProcedure
    .input(z.object({ id: z.string(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updatedTodo] = await db
        .update(todos)
        .set({ completed: input.completed })
        .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id!)))
        .returning()
      return updatedTodo
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(todos)
        .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id!)))
      return { id: input.id }
    }),
})
