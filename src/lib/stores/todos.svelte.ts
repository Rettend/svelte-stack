import { session } from '$lib/stores/session.svelte'

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
  userId: string
}

interface TodoStoreState {
  items: Todo[]
  isLoading: boolean
  error: string | null
}

interface TodoStoreMethods {
  loadTodos: () => Promise<void>
  addTodo: (text: string) => Promise<void>
  toggleTodo: (id: string, completed: boolean) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
}

type TodoStore = TodoStoreState & TodoStoreMethods

function createTodoStore() {
  const store = $state<TodoStore>({
    items: [],
    isLoading: false,
    error: null,

    async loadTodos() {
      this.isLoading = true
      this.error = null
      try {
        const response = await fetch('/api/todos')
        if (!response.ok) {
          const errorResult = await response.json()
          throw new Error(errorResult.message || `Failed to fetch todos: ${response.statusText}`)
        }
        this.items = await response.json()
      }
      catch (err: any) {
        this.error = err.message
        this.items = []
      }
      finally {
        this.isLoading = false
      }
    },

    async addTodo(text: string) {
      if (!text.trim())
        return
      this.isLoading = true
      this.error = null
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (!response.ok) {
          const errorResult = await response.json()
          throw new Error(errorResult.message || `Failed to add todo: ${response.statusText}`)
        }
        const newTodo: Todo = await response.json()
        this.items = [newTodo, ...this.items]
      }
      catch (err: any) {
        this.error = err.message
      }
      finally {
        this.isLoading = false
      }
    },

    async toggleTodo(id: string, completed: boolean) {
      this.error = null
      const originalItems = [...this.items]
      const todoIndex = this.items.findIndex(todo => todo.id === id)
      if (todoIndex === -1)
        return

      const updatedItems = [...this.items]
      updatedItems[todoIndex] = { ...updatedItems[todoIndex], completed }
      this.items = updatedItems

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed }),
        })
        if (!response.ok) {
          const errorResult = await response.json()
          this.items = originalItems
          throw new Error(errorResult.message || `Failed to update todo: ${response.statusText}`)
        }
      }
      catch (err: any) {
        this.error = err.message
        this.items = originalItems
      }
    },

    async deleteTodo(id: string) {
      this.error = null
      const originalItems = [...this.items]
      const initialLength = this.items.length
      this.items = this.items.filter(todo => todo.id !== id)

      if (this.items.length === initialLength) {
        this.items = originalItems
        return
      }

      try {
        const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
        if (!response.ok) {
          const errorResult = await response.json()
          this.items = originalItems
          throw new Error(errorResult.message || `Failed to delete todo: ${response.statusText}`)
        }
      }
      catch (err: any) {
        this.error = err.message
        this.items = originalItems
      }
    },
  })

  $effect.root(() => {
    $effect(() => {
      const user = session.current?.user
      if (user) {
        if (store.items.length === 0 && !store.isLoading)
          store.loadTodos()
      }
      else if (session.current !== undefined) {
        if (store.items.length > 0)
          store.items = []

        if (store.error)
          store.error = null
      }
    })
  })

  return store
}

export const todoStore = createTodoStore()
