import { session } from '$lib/stores/session.svelte'
import { trpc } from '$lib/trpc'

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
        const fetchedTodos = await trpc.todos.list.query()
        this.items = fetchedTodos.map(todo => ({
          ...todo,
          createdAt: new Date(todo.createdAt).getTime(),
        })) as Todo[]
      }
      catch (err: any) {
        this.error = err.message || 'Failed to fetch todos'
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
        const newTodoFromServer = await trpc.todos.create.mutate({ text })
        const newTodoProcessed: Todo = {
          ...newTodoFromServer,
          createdAt: new Date(newTodoFromServer.createdAt).getTime(),
        }
        this.items = [newTodoProcessed, ...this.items]
      }
      catch (err: any) {
        this.error = err.message || 'Failed to add todo'
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
        await trpc.todos.update.mutate({ id, completed })
      }
      catch (err: any) {
        this.error = err.message || 'Failed to update todo'
        this.items = originalItems
      }
    },

    async deleteTodo(id: string) {
      this.error = null
      const originalItems = [...this.items]

      const itemIndex = this.items.findIndex(todo => todo.id === id)
      if (itemIndex === -1)
        return

      this.items = this.items.filter(todo => todo.id !== id)

      try {
        await trpc.todos.delete.mutate({ id })
      }
      catch (err: any) {
        this.error = err.message || 'Failed to delete todo'
        this.items = originalItems
      }
    },
  })

  $effect.root(() => {
    $effect(() => {
      const user = session.current?.user
      if (user) {
        if (store.items.length === 0 && !store.isLoading && !store.error)
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
