import type { Todo } from './todos.svelte'
import { trpc } from '$lib/trpc'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from './session.svelte'
import { todoStore } from './todos.svelte'

vi.mock('$lib/trpc', () => ({
  trpc: {
    todos: {
      list: {
        query: vi.fn(),
      },
      create: {
        mutate: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
    },
  },
}))

function runInEffectRoot(testFn: () => void | Promise<void>) {
  let cleanup: () => void
  const promise = new Promise<void>((resolve, reject) => {
    cleanup = $effect.root(() => {
      try {
        Promise.resolve(testFn()).then(resolve).catch(reject)
      }
      catch (e) {
        reject(e)
      }
    })
  })
  return { promise, cleanup: () => cleanup?.() }
}

describe('todoStore', () => {
  let cleanupEffect: (() => void) | undefined

  beforeEach(() => {
    vi.mocked(trpc.todos.list.query).mockReset()
    vi.mocked(trpc.todos.create.mutate).mockReset()
    vi.mocked(trpc.todos.update.mutate).mockReset()
    vi.mocked(trpc.todos.delete.mutate).mockReset()

    todoStore.items = []
    todoStore.error = null
    todoStore.isLoading = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (cleanupEffect) {
      cleanupEffect()
      cleanupEffect = undefined
    }
    session.current = undefined
    todoStore.items = []
    todoStore.error = null
    todoStore.isLoading = false
    flushSync()
  })

  it('should have correct initial state (before session triggers load)', () => {
    session.current = undefined
    todoStore.items = []
    todoStore.isLoading = false
    todoStore.error = null
    flushSync()

    expect(todoStore.items).toEqual([])
    expect(todoStore.isLoading).toBe(false)
    expect(todoStore.error).toBeNull()
  })

  describe('loadTodos', () => {
    it('should load todos successfully and update store state', async () => {
      const mockServerTodos = [
        { id: '1', text: 'Todo 1', completed: false, createdAt: new Date(Date.now() - 10000).toISOString(), userId: 'test-user-id' },
        { id: '2', text: 'Todo 2', completed: true, createdAt: new Date(Date.now() - 5000).toISOString(), userId: 'test-user-id' },
      ]
      const expectedStoreTodos: Todo[] = mockServerTodos.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))

      vi.mocked(trpc.todos.list.query).mockResolvedValueOnce(mockServerTodos as any)

      todoStore.items = []

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.loadTodos()
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items).toEqual(expectedStoreTodos)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.list.query).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when loading todos', async () => {
      const apiErrorMessage = 'API problem loading todos'
      vi.mocked(trpc.todos.list.query).mockRejectedValueOnce(new Error(apiErrorMessage))

      todoStore.items = []

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.loadTodos()
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items).toEqual([])
        expect(todoStore.error).toBe(apiErrorMessage)
        expect(trpc.todos.list.query).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should be called by the effect when a user logs in and items are empty', async () => {
      const mockServerTodos = [{ id: 'eff', text: 'Effect Todo', completed: false, createdAt: new Date().toISOString(), userId: 'test-user-id' }]
      const expectedStoreTodos: Todo[] = mockServerTodos.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))

      vi.mocked(trpc.todos.list.query).mockResolvedValueOnce(mockServerTodos as any)

      todoStore.items = []
      todoStore.isLoading = false

      const { promise, cleanup } = runInEffectRoot(async () => {
        session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
        flushSync()

        await vi.waitFor(() => {
          expect(trpc.todos.list.query).toHaveBeenCalledTimes(1)
        })

        await vi.waitFor(() => {
          expect(todoStore.isLoading).toBe(false)
        })

        expect(todoStore.items).toEqual(expectedStoreTodos)
        expect(todoStore.error).toBeNull()
      })
      cleanupEffect = cleanup
      await promise
    })
  })

  it('should clear todos and errors when user logs out or session is null', async () => {
    const initialServerTodos = [{ id: '1', text: 'Old Todo', completed: false, createdAt: new Date().toISOString(), userId: 'test-user-id' }]
    const initialStoreTodos: Todo[] = initialServerTodos.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))

    todoStore.items = [...initialStoreTodos]
    todoStore.error = 'Some existing error'
    session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
    flushSync()

    const { promise, cleanup } = runInEffectRoot(async () => {
      session.current = null
      flushSync()

      expect(todoStore.items).toEqual([])
      expect(todoStore.error).toBeNull()
    })
    cleanupEffect = cleanup
    await promise

    todoStore.items = [...initialStoreTodos]
    todoStore.error = 'Another existing error'
    session.current = undefined
    flushSync()

    const { promise: promise2, cleanup: cleanup2 } = runInEffectRoot(async () => {
      session.current = null
      flushSync()
      expect(todoStore.items).toEqual([])
      expect(todoStore.error).toBeNull()
    })
    cleanupEffect = cleanup2
    await promise2
  })

  describe('addTodo', () => {
    it('should add a todo successfully and update store state', async () => {
      const newTodoText = 'New Test Todo'
      const mockNewServerTodo = { id: 'new-id', text: newTodoText, completed: false, createdAt: new Date().toISOString(), userId: 'test-user-id' }
      const expectedNewStoreTodo: Todo = { ...mockNewServerTodo, createdAt: new Date(mockNewServerTodo.createdAt).getTime() }

      vi.mocked(trpc.todos.create.mutate).mockResolvedValueOnce(mockNewServerTodo as any)

      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      const initialServerTodos = [
        { id: '1', text: 'Existing Todo', completed: false, createdAt: new Date(Date.now() - 1000).toISOString(), userId: 'test-user-id' },
      ]
      const initialStoreTodos: Todo[] = initialServerTodos.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))
      todoStore.items = [...initialStoreTodos]
      todoStore.error = null
      todoStore.isLoading = false

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.addTodo(newTodoText)
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialStoreTodos.length + 1)
        expect(todoStore.items[0]).toEqual(expectedNewStoreTodo)
        expect(todoStore.items[1]).toEqual(initialStoreTodos[0])
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.create.mutate).toHaveBeenCalledWith({ text: newTodoText })
        expect(trpc.todos.create.mutate).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when adding a todo', async () => {
      const newTodoText = 'Another Test Todo'
      const apiErrorMessage = 'Failed to add todo'

      vi.mocked(trpc.todos.create.mutate).mockRejectedValueOnce(new Error(apiErrorMessage))

      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      const initialServerTodos = [
        { id: '1', text: 'Existing Todo', completed: false, createdAt: new Date().toISOString(), userId: 'test-user-id' },
      ]
      const initialStoreTodos: Todo[] = initialServerTodos.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))
      todoStore.items = [...initialStoreTodos]
      todoStore.error = null
      todoStore.isLoading = false

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.addTodo(newTodoText)
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialStoreTodos.length)
        expect(todoStore.items).toEqual(initialStoreTodos)
        expect(todoStore.error).toBe(apiErrorMessage)
        expect(trpc.todos.create.mutate).toHaveBeenCalledWith({ text: newTodoText })
        expect(trpc.todos.create.mutate).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should not add a todo if text is empty or whitespace', async () => {
      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      const initialServerTodos = [
        { id: '1', text: 'Existing Todo', completed: false, createdAt: new Date().toISOString(), userId: 'test-user-id' },
      ]
      const initialStoreTodos: Todo[] = initialServerTodos.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))
      todoStore.items = [...initialStoreTodos]
      todoStore.error = null
      todoStore.isLoading = false

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.addTodo('   ')
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialStoreTodos.length)
        expect(todoStore.items).toEqual(initialStoreTodos)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.create.mutate).not.toHaveBeenCalled()

        await todoStore.addTodo('')
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialStoreTodos.length)
        expect(todoStore.items).toEqual(initialStoreTodos)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.create.mutate).not.toHaveBeenCalled()
      })
      cleanupEffect = cleanup
      await promise
    })
  })

  describe('toggleTodo', () => {
    const todoToToggleId = 'toggle-me'
    const initialServerTodosForToggle = [
      { id: 'other-id', text: 'Another Todo', completed: false, createdAt: new Date(Date.now() - 2000).toISOString(), userId: 'test-user-id' },
      { id: todoToToggleId, text: 'Todo to Toggle', completed: false, createdAt: new Date(Date.now() - 1000).toISOString(), userId: 'test-user-id' },
    ]
    let initialStoreTodosForToggle: Todo[]

    beforeEach(() => {
      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      initialStoreTodosForToggle = initialServerTodosForToggle.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))
      todoStore.items = JSON.parse(JSON.stringify(initialStoreTodosForToggle))
      todoStore.error = null
      todoStore.isLoading = false
    })

    it('should toggle a todo successfully and update store state', async () => {
      const newCompletedStatus = true
      vi.mocked(trpc.todos.update.mutate).mockResolvedValueOnce({ id: todoToToggleId, completed: newCompletedStatus, text: 'Todo to Toggle', createdAt: initialServerTodosForToggle.find(t => t.id === todoToToggleId)!.createdAt, userId: 'test-user-id' } as any)

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.toggleTodo(todoToToggleId, newCompletedStatus)
        flushSync()

        const toggledItem = todoStore.items.find(t => t.id === todoToToggleId)
        expect(toggledItem?.completed).toBe(newCompletedStatus)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.update.mutate).toHaveBeenCalledWith({ id: todoToToggleId, completed: newCompletedStatus })
        expect(trpc.todos.update.mutate).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when toggling a todo and revert state', async () => {
      const newCompletedStatus = true
      const originalStatus = initialStoreTodosForToggle.find(t => t.id === todoToToggleId)!.completed
      const apiErrorMessage = 'Failed to toggle todo'

      vi.mocked(trpc.todos.update.mutate).mockRejectedValueOnce(new Error(apiErrorMessage))

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.toggleTodo(todoToToggleId, newCompletedStatus)
        flushSync()

        const toggledItem = todoStore.items.find(t => t.id === todoToToggleId)
        expect(toggledItem?.completed).toBe(originalStatus)
        expect(todoStore.error).toBe(apiErrorMessage)
        expect(trpc.todos.update.mutate).toHaveBeenCalledWith({ id: todoToToggleId, completed: newCompletedStatus })
        expect(trpc.todos.update.mutate).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should not make an API call if todo ID does not exist', async () => {
      const nonExistentId = 'non-existent-id'

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.toggleTodo(nonExistentId, true)
        flushSync()

        expect(todoStore.items).toEqual(initialStoreTodosForToggle)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.update.mutate).not.toHaveBeenCalled()
      })
      cleanupEffect = cleanup
      await promise
    })
  })

  describe('deleteTodo', () => {
    const todoToDeleteId = 'delete-me'
    const initialServerTodosForDelete = [
      { id: todoToDeleteId, text: 'Todo to Delete', completed: false, createdAt: new Date(Date.now() - 3000).toISOString(), userId: 'test-user-id' },
      { id: 'other-id', text: 'Another Todo', completed: false, createdAt: new Date(Date.now() - 2000).toISOString(), userId: 'test-user-id' },
    ]
    let initialStoreTodosForDelete: Todo[]

    beforeEach(() => {
      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      initialStoreTodosForDelete = initialServerTodosForDelete.map(t => ({ ...t, createdAt: new Date(t.createdAt).getTime() }))
      todoStore.items = JSON.parse(JSON.stringify(initialStoreTodosForDelete)) // Deep copy
      todoStore.error = null
    })

    it('should delete a todo successfully and update store state', async () => {
      vi.mocked(trpc.todos.delete.mutate).mockResolvedValueOnce({ id: todoToDeleteId })

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.deleteTodo(todoToDeleteId)
        flushSync()

        expect(todoStore.items.find(t => t.id === todoToDeleteId)).toBeUndefined()
        expect(todoStore.items.length).toBe(initialStoreTodosForDelete.length - 1)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.delete.mutate).toHaveBeenCalledWith({ id: todoToDeleteId })
        expect(trpc.todos.delete.mutate).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when deleting a todo and revert state', async () => {
      const apiErrorMessage = 'Failed to delete todo'
      vi.mocked(trpc.todos.delete.mutate).mockRejectedValueOnce(new Error(apiErrorMessage))

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.deleteTodo(todoToDeleteId)
        flushSync()

        expect(todoStore.items).toEqual(initialStoreTodosForDelete)
        expect(todoStore.items.length).toBe(initialStoreTodosForDelete.length)
        expect(todoStore.error).toBe(apiErrorMessage)
        expect(trpc.todos.delete.mutate).toHaveBeenCalledWith({ id: todoToDeleteId })
        expect(trpc.todos.delete.mutate).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should not make an API call if todo ID does not exist for deletion', async () => {
      const nonExistentId = 'non-existent-id'

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.deleteTodo(nonExistentId)
        flushSync()

        expect(todoStore.items).toEqual(initialStoreTodosForDelete)
        expect(todoStore.error).toBeNull()
        expect(trpc.todos.delete.mutate).not.toHaveBeenCalled()
      })
      cleanupEffect = cleanup
      await promise
    })
  })
})
