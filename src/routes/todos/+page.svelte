<script lang='ts'>
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { session } from '$lib/stores/session.svelte'
  import { todoStore } from '$lib/stores/todos.svelte'

  let newTodoText = $state('')

  function handleAddTodo(event: SubmitEvent) {
    event.preventDefault()
    if (newTodoText.trim()) {
      todoStore.addTodo(newTodoText.trim())
      newTodoText = ''
    }
  }

  function handleToggleTodo(todoId: string, completed: boolean) {
    todoStore.toggleTodo(todoId, completed)
  }

  function handleDeleteTodo(todoId: string) {
    todoStore.deleteTodo(todoId)
  }
</script>

<div class='mx-auto max-w-2xl py-8 container'>
  <h1 class='mb-6 text-3xl text-primary font-bold'>My Todos</h1>

  {#if session.current?.user}
    <form onsubmit={handleAddTodo} class='mb-8 flex items-center gap-2'>
      <Input type='text' bind:value={newTodoText} placeholder='What needs to be done?' class='flex-grow' />
      <Button type='submit' disabled={!newTodoText.trim() || todoStore.isLoading}>
        {#if todoStore.isLoading && newTodoText.trim()}Adding...{:else}Add Todo{/if}
      </Button>
    </form>

    {#if todoStore.isLoading && todoStore.items.length === 0}
      <p class='text-muted-foreground'>Loading todos...</p>
    {:else if todoStore.error}
      <p class='text-destructive'>Error: {todoStore.error}</p>
    {:else if todoStore.items.length === 0}
      <p class='text-muted-foreground'>No todos yet! Add one above.</p>
    {:else}
      <ul class='space-y-3'>
        {#each todoStore.items as todo (todo.id)}
          <li class='flex items-center justify-between border rounded-md bg-card p-4 shadow-sm'>
            <div class='flex items-center gap-3'>
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={checkedState => handleToggleTodo(todo.id, !!checkedState)}
              />
              <Label for={`todo-${todo.id}`} class="{todo.completed ? 'text-muted-foreground line-through' : ''} cursor-pointer text-lg">
                {todo.text}
              </Label>
            </div>
            <Button variant='ghost' size='icon' onclick={() => handleDeleteTodo(todo.id)} title='Delete todo'>
              <span class='i-solar:trash-bin-minimalistic-bold size-5 text-destructive'></span>
            </Button>
          </li>
        {/each}
      </ul>
    {/if}
  {:else if session.current === undefined}
    <p class='text-muted-foreground'>Loading session...</p>
  {:else}
    <p class='text-center text-lg text-muted-foreground'>
      Please <a href='/auth/signin' class='text-primary hover:underline'>sign in</a> to manage your todos.
    </p>
  {/if}
</div>
