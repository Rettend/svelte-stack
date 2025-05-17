import type { RequestHandler } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import { todos } from '$lib/server/db/schema'
import { json } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'

// PUT /api/todos/[id] - Toggle todo completion status
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id)
    return json({ message: 'Unauthorized' }, { status: 401 })

  const todoId = params.id
  if (!todoId)
    return json({ message: 'Todo ID is required' }, { status: 400 })

  try {
    const { completed } = await request.json() as { completed: boolean }
    if (typeof completed !== 'boolean')
      return json({ message: 'Invalid completed status' }, { status: 400 })

    const [updatedTodo] = await db
      .update(todos)
      .set({ completed })
      .where(and(eq(todos.id, todoId), eq(todos.userId, session.user.id)))
      .returning()

    if (!updatedTodo)
      return json({ message: 'Todo not found or user unauthorized' }, { status: 404 })

    return json(updatedTodo)
  }
  catch (error) {
    console.error(`Failed to update todo ${todoId}:`, error)
    if (error instanceof SyntaxError)
      return json({ message: 'Invalid JSON payload' }, { status: 400 })

    return json({ message: 'Failed to update todo' }, { status: 500 })
  }
}

// DELETE /api/todos/[id] - Delete a todo
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id)
    return json({ message: 'Unauthorized' }, { status: 401 })

  const todoId = params.id
  if (!todoId)
    return json({ message: 'Todo ID is required' }, { status: 400 })

  try {
    const [deletedTodo] = await db
      .delete(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, session.user.id)))
      .returning()

    if (!deletedTodo)
      return json({ message: 'Todo not found or user unauthorized' }, { status: 404 })

    return json({ message: 'Todo deleted successfully' }, { status: 200 })
  }
  catch (error) {
    console.error(`Failed to delete todo ${todoId}:`, error)
    return json({ message: 'Failed to delete todo' }, { status: 500 })
  }
}
