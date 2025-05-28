import type { Session } from '@auth/sveltekit'
import { cleanup, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from '../../src/lib/stores/session.svelte'
import { todoStore } from '../../src/lib/stores/todos.svelte'
import TodosPage from '../../src/routes/todos/+page.svelte'
import { renderRouteComponent } from '../utils/route-testing'

vi.mock('../../src/lib/stores/todos.svelte', () => ({
  todoStore: {
    items: [],
    isLoading: false,
    error: null,
    addTodo: vi.fn(),
    toggleTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}))

describe('todos Page', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    session.current = undefined
    vi.mocked(todoStore).items = []
    vi.mocked(todoStore).isLoading = false
    vi.mocked(todoStore).error = null
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    session.current = undefined
  })

  it('renders the todos page title', () => {
    renderRouteComponent(TodosPage)
    expect(screen.getByText('My Todos')).toBeInTheDocument()
  })

  it('shows sign in message when user is not authenticated', async () => {
    session.current = null
    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByText((content, element) => {
      const hasText = element?.textContent?.includes('Please')
        && element?.textContent?.includes('sign in')
        && element?.textContent?.includes('to manage your todos')
      return !!(hasText && element && element.tagName === 'P')
    })).toBeInTheDocument()
  })

  it('shows loading message when session is undefined', async () => {
    session.current = undefined
    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByText('Loading session...')).toBeInTheDocument()
  })

  it('renders add todo form when user is authenticated', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession

    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
    expect(screen.getByText('Add Todo')).toBeInTheDocument()
  })

  it('shows empty state when no todos exist', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession
    vi.mocked(todoStore).items = []

    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByText('No todos yet! Add one above.')).toBeInTheDocument()
  })

  it('displays todos when they exist', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession
    vi.mocked(todoStore).items = [
      { id: '1', text: 'Test Todo 1', completed: false, createdAt: Date.now(), userId: 'test-user' },
      { id: '2', text: 'Test Todo 2', completed: true, createdAt: Date.now(), userId: 'test-user' },
    ]

    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByText('Test Todo 1')).toBeInTheDocument()
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument()
  })

  it('calls addTodo when form is submitted', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession

    renderRouteComponent(TodosPage)
    await tick()

    const input = screen.getByPlaceholderText('What needs to be done?')
    const addButton = screen.getByText('Add Todo')

    await user.type(input, 'New test todo')
    await user.click(addButton)

    expect(vi.mocked(todoStore.addTodo)).toHaveBeenCalledWith('New test todo')
  })

  it('calls toggleTodo when checkbox is clicked', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession
    vi.mocked(todoStore).items = [
      { id: '1', text: 'Test Todo', completed: false, createdAt: Date.now(), userId: 'test-user' },
    ]

    renderRouteComponent(TodosPage)
    await tick()

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    await waitFor(() => {
      expect(vi.mocked(todoStore.toggleTodo)).toHaveBeenCalledWith('1', true)
    })
  })

  it('calls deleteTodo when delete button is clicked', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession
    vi.mocked(todoStore).items = [
      { id: '1', text: 'Test Todo', completed: false, createdAt: Date.now(), userId: 'test-user' },
    ]

    renderRouteComponent(TodosPage)
    await tick()

    const deleteButton = screen.getByTitle('Delete todo')
    await user.click(deleteButton)

    expect(vi.mocked(todoStore.deleteTodo)).toHaveBeenCalledWith('1')
  })

  it('shows error message when there is an error', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession
    vi.mocked(todoStore).error = 'Failed to load todos'

    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByText('Error: Failed to load todos')).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    const mockSession: Session = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }
    session.current = mockSession
    vi.mocked(todoStore).isLoading = true
    vi.mocked(todoStore).items = []

    renderRouteComponent(TodosPage)
    await tick()

    expect(screen.getByText('Loading todos...')).toBeInTheDocument()
  })
})
