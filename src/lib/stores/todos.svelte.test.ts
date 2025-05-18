import type { Todo } from './todos.svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from './session.svelte'
import { todoStore } from './todos.svelte'

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
  let originalFetch: typeof globalThis.fetch
  let cleanupEffect: () => void

  beforeEach(() => {
    originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn()

    // session.current is intentionally not set here; afterEach ensures it's undefined.
    // This allows tests to control session state explicitly if needed,
    // and prevents auto-loading from the effect in todos.svelte.ts for direct method tests.
    todoStore.items = []
    todoStore.error = null
    todoStore.isLoading = false
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
    if (cleanupEffect)
      cleanupEffect()

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
      const mockTodos: Todo[] = [
        { id: '1', text: 'Todo 1', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
        { id: '2', text: 'Todo 2', completed: true, createdAt: Date.now(), userId: 'test-user-id' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos,
      } as Response)

      // session.current is not set here to test loadTodos directly without effect interference
      todoStore.items = []

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.loadTodos()
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items).toEqual(mockTodos)
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos')
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when loading todos', async () => {
      const apiResponseMessage = 'API problem'
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
        json: async () => ({ message: apiResponseMessage }),
      } as Response)

      // session.current is not set here to test loadTodos directly without effect interference
      todoStore.items = []

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.loadTodos()
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items).toEqual([])
        expect(todoStore.error).toBe(apiResponseMessage)
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos')
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should be called by the effect when a user logs in and items are empty', async () => {
      const mockTodos: Todo[] = [{ id: 'eff', text: 'Effect Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' }]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos,
      } as Response)

      todoStore.items = []
      todoStore.isLoading = false
      // session.current is undefined initially from beforeEach/afterEach

      const { promise, cleanup } = runInEffectRoot(async () => {
        session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any // Set user to trigger effect
        flushSync()

        await vi.waitFor(() => {
          expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos')
        })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1) // Ensure fetch was called exactly once by the effect

        await vi.waitFor(() => {
          expect(todoStore.isLoading).toBe(false)
        })

        expect(todoStore.items).toEqual(mockTodos)
        expect(todoStore.error).toBeNull()
      })
      cleanupEffect = cleanup
      await promise
    })
  })

  it('should clear todos and errors when user logs out or session is null', async () => {
    // Setup: Store has items and an error, user is initially logged in
    const initialTodos: Todo[] = [{ id: '1', text: 'Old Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' }]
    todoStore.items = [...initialTodos]
    todoStore.error = 'Some existing error'
    session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
    flushSync() // Ensure effect reacts to initial session

    // Act: Simulate logout or session resolving to null
    const { promise, cleanup } = runInEffectRoot(async () => {
      session.current = null // Trigger the effect's cleanup logic
      flushSync()

      // Assert: Store items and error are cleared
      expect(todoStore.items).toEqual([])
      expect(todoStore.error).toBeNull()
    })
    cleanupEffect = cleanup
    await promise

    // Additionally, test the scenario where session was undefined then becomes null
    todoStore.items = [...initialTodos]
    todoStore.error = 'Another existing error'
    session.current = undefined // Start as if session hasn't loaded
    flushSync()

    const { promise: promise2, cleanup: cleanup2 } = runInEffectRoot(async () => {
      session.current = null // Session loads, but no user
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
      const mockNewTodo: Todo = { id: 'new-id', text: newTodoText, completed: false, createdAt: Date.now(), userId: 'test-user-id' }

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewTodo,
      } as Response)

      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any // Mock active session
      const initialTodos: Todo[] = [
        { id: '1', text: 'Existing Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
      ]
      todoStore.items = [...initialTodos]
      todoStore.error = null
      todoStore.isLoading = false

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.addTodo(newTodoText)
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialTodos.length + 1)
        expect(todoStore.items[0]).toEqual(mockNewTodo)
        expect(todoStore.items[1]).toEqual(initialTodos[0])
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newTodoText }),
        })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when adding a todo', async () => {
      const newTodoText = 'Another Test Todo'
      const apiResponseMessage = 'Failed to add'

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
        json: async () => ({ message: apiResponseMessage }),
      } as Response)

      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      const initialTodos: Todo[] = [
        { id: '1', text: 'Existing Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
      ]
      todoStore.items = [...initialTodos]
      todoStore.error = null
      todoStore.isLoading = false

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.addTodo(newTodoText)
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialTodos.length)
        expect(todoStore.items).toEqual(initialTodos)
        expect(todoStore.error).toBe(apiResponseMessage)
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newTodoText }),
        })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should not add a todo if text is empty or whitespace', async () => {
      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      const initialTodos: Todo[] = [
        { id: '1', text: 'Existing Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
      ]
      todoStore.items = [...initialTodos]
      todoStore.error = null
      todoStore.isLoading = false
      globalThis.fetch = vi.fn() // Reset fetch mock for this specific test

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.addTodo('   ') // Test with whitespace
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialTodos.length)
        expect(todoStore.items).toEqual(initialTodos)
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).not.toHaveBeenCalled()

        await todoStore.addTodo('') // Test with empty string
        flushSync()

        expect(todoStore.isLoading).toBe(false)
        expect(todoStore.items.length).toBe(initialTodos.length)
        expect(todoStore.items).toEqual(initialTodos)
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).not.toHaveBeenCalled()
      })
      cleanupEffect = cleanup
      await promise
    })
  })

  describe('toggleTodo', () => {
    const todoToToggleId = 'toggle-me'
    const initialTodos: Todo[] = [
      { id: 'other-id', text: 'Another Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
      { id: todoToToggleId, text: 'Todo to Toggle', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
    ]

    beforeEach(() => {
      // Ensure a session is active for these tests
      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      todoStore.items = JSON.parse(JSON.stringify(initialTodos)) // Deep copy to reset between tests
      todoStore.error = null
      todoStore.isLoading = false // toggleTodo doesn't set isLoading
    })

    it('should toggle a todo successfully and update store state', async () => {
      const newCompletedStatus = true
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Successful PUT usually returns 200 or 204 with no body or updated item
      } as Response)

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.toggleTodo(todoToToggleId, newCompletedStatus)
        flushSync()

        const toggledItem = todoStore.items.find(t => t.id === todoToToggleId)
        expect(toggledItem?.completed).toBe(newCompletedStatus)
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${todoToToggleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: newCompletedStatus }),
        })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when toggling a todo and revert state', async () => {
      const newCompletedStatus = true
      const originalStatus = initialTodos.find(t => t.id === todoToToggleId)!.completed
      const apiResponseMessage = 'Failed to toggle'

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
        json: async () => ({ message: apiResponseMessage }),
      } as Response)

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.toggleTodo(todoToToggleId, newCompletedStatus)
        flushSync()

        const toggledItem = todoStore.items.find(t => t.id === todoToToggleId)
        expect(toggledItem?.completed).toBe(originalStatus) // Reverted
        expect(todoStore.error).toBe(apiResponseMessage)
        expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${todoToToggleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: newCompletedStatus }),
        })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should not make an API call if todo ID does not exist', async () => {
      const nonExistentId = 'non-existent-id'
      globalThis.fetch = vi.fn() // Reset fetch mock

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.toggleTodo(nonExistentId, true)
        flushSync()

        expect(todoStore.items).toEqual(initialTodos) // State should be unchanged
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).not.toHaveBeenCalled()
      })
      cleanupEffect = cleanup
      await promise
    })
  })

  describe('deleteTodo', () => {
    const todoToDeleteId = 'delete-me'
    const initialTodos: Todo[] = [
      { id: todoToDeleteId, text: 'Todo to Delete', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
      { id: 'other-id', text: 'Another Todo', completed: false, createdAt: Date.now(), userId: 'test-user-id' },
    ]

    beforeEach(() => {
      session.current = { user: { id: 'test-user-id' }, expires: 'sometime' } as any
      todoStore.items = JSON.parse(JSON.stringify(initialTodos)) // Deep copy
      todoStore.error = null
    })

    it('should delete a todo successfully and update store state', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // DELETE typically returns 200/204 with no body
      } as Response)

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.deleteTodo(todoToDeleteId)
        flushSync()

        expect(todoStore.items.find(t => t.id === todoToDeleteId)).toBeUndefined()
        expect(todoStore.items.length).toBe(initialTodos.length - 1)
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${todoToDeleteId}`, { method: 'DELETE' })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should handle API error when deleting a todo and revert state', async () => {
      const apiResponseMessage = 'Failed to delete'
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
        json: async () => ({ message: apiResponseMessage }),
      } as Response)

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.deleteTodo(todoToDeleteId)
        flushSync()

        expect(todoStore.items).toEqual(initialTodos) // State reverted
        expect(todoStore.items.length).toBe(initialTodos.length)
        expect(todoStore.error).toBe(apiResponseMessage)
        expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${todoToDeleteId}`, { method: 'DELETE' })
        expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      })
      cleanupEffect = cleanup
      await promise
    })

    it('should not make an API call if todo ID does not exist for deletion', async () => {
      const nonExistentId = 'non-existent-id'
      globalThis.fetch = vi.fn() // Reset fetch mock for this test

      const { promise, cleanup } = runInEffectRoot(async () => {
        await todoStore.deleteTodo(nonExistentId)
        flushSync()

        expect(todoStore.items).toEqual(initialTodos)
        expect(todoStore.error).toBeNull()
        expect(globalThis.fetch).not.toHaveBeenCalled()
      })
      cleanupEffect = cleanup
      await promise
    })
  })
})
