import type { AppRouter } from '$lib/server/trpc'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { session } from '$lib/stores/session.svelte'
import { trpc } from '$lib/trpc/client'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>
export type Todo = RouterOutput['todos']['list'][number]

const TODOS_QUERY_KEY = ['todos', 'list']

export function useTodos() {
  const trpcClient = trpc()

  const listTodos = createQuery<RouterOutput['todos']['list']>({
    queryKey: TODOS_QUERY_KEY,
    queryFn: () => trpcClient.todos.list.query(),
    enabled: !!session.current?.user,
  })

  return {
    list: listTodos,
  }
}

export function useTodoMutations() {
  const queryClient = useQueryClient()
  const trpcClient = trpc()

  const addTodo = createMutation<RouterOutput['todos']['create'], Error, RouterInput['todos']['create']['text']>({
    mutationFn: (newTodoText: RouterInput['todos']['create']['text']) =>
      trpcClient.todos.create.mutate({ text: newTodoText }),
    onSuccess: (newTodo: RouterOutput['todos']['create']) => {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, oldTodos =>
        oldTodos ? [newTodo, ...oldTodos] : [newTodo])
    },
  })

  const toggleTodo = createMutation<RouterOutput['todos']['toggle'], Error, RouterInput['todos']['toggle']>({
    mutationFn: (variables: RouterInput['todos']['toggle']) =>
      trpcClient.todos.toggle.mutate(variables),
    onSuccess: (updatedTodo: RouterOutput['todos']['toggle']) => {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, oldTodos =>
        oldTodos?.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo) ?? [])
    },
  })

  const deleteTodo = createMutation<RouterOutput['todos']['delete'], Error, RouterInput['todos']['delete']>({
    mutationFn: (variables: RouterInput['todos']['delete']) =>
      trpcClient.todos.delete.mutate(variables),
    onSuccess: (_data: RouterOutput['todos']['delete'], variables: RouterInput['todos']['delete']) => {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, oldTodos =>
        oldTodos?.filter(todo => todo.id !== variables.id) ?? [])
    },
  })

  return {
    add: addTodo,
    toggle: toggleTodo,
    delete: deleteTodo,
  }
}
