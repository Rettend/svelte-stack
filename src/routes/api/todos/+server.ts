import type { RequestHandler } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import { todos } from '$lib/server/db/schema'
import { json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

// GET /api/todos - Get all todos for the current user
export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id)
    return json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userTodos = await db.query.todos.findMany({
      where: eq(todos.userId, session.user.id),
      orderBy: (todos, { desc }) => [desc(todos.createdAt)],
    })
    return json(userTodos)
  }
  catch (error) {
    console.error('Failed to fetch todos:', error)
    return json({ message: 'Failed to fetch todos' }, { status: 500 })
  }
}

// POST /api/todos - Create a new todo
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id)
    return json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { text } = await request.json() as { text: string }
    if (!text || typeof text !== 'string' || text.trim().length === 0)
      return json({ message: 'Invalid todo text' }, { status: 400 })

    const [newTodo] = await db
      .insert(todos)
      .values({
        text: text.trim(),
        userId: session.user.id,
      })
      .returning()

    return json(newTodo, { status: 201 })
  }
  catch (error) {
    console.error('Failed to create todo:', error)
    if (error instanceof SyntaxError)
      return json({ message: 'Invalid JSON payload' }, { status: 400 })

    return json({ message: 'Failed to create todo' }, { status: 500 })
  }
}
