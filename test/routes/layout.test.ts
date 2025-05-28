import type { Session } from '@auth/sveltekit'
import { cleanup, screen, waitFor } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { session } from '../../src/lib/stores/session.svelte'
import Layout from '../../src/routes/+layout.svelte'
import { createMockPageContext, renderRouteComponent } from '../utils/route-testing'

vi.mock('@auth/sveltekit/client', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@unocss/reset/tailwind.css', () => ({}))
vi.mock('virtual:uno.css', () => ({}))
vi.mock('@fontsource/ubuntu', () => ({}))

describe('layout Component', () => {
  beforeEach(() => {
    session.current = undefined
  })

  afterEach(() => {
    cleanup()
    session.current = undefined
    vi.clearAllMocks()
  })

  it('renders the main layout structure', async () => {
    const pageContext = createMockPageContext({
      data: { session: null },
    })

    renderRouteComponent(Layout, {}, pageContext)
    await waitFor(() => {
      expect(screen.getByText('Svelte Stack')).toBeInTheDocument()
    })
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Todos')).toBeInTheDocument()
  })

  it('shows login buttons when user is not authenticated', async () => {
    const pageContext = createMockPageContext({
      data: { session: null },
    })

    renderRouteComponent(Layout, {}, pageContext)

    await waitFor(() => {
      expect(screen.getByText('Log in with GitHub')).toBeInTheDocument()
    })
    expect(screen.getByText('Log in with Google')).toBeInTheDocument()
  })

  it('shows user info and sign out when authenticated', async () => {
    const mockSession: Session = {
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      },
      expires: '2024-12-31T23:59:59Z',
    }

    const pageContext = createMockPageContext({
      data: { session: mockSession },
    })

    renderRouteComponent(Layout, {}, pageContext)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.queryByText('Log in with GitHub')).not.toBeInTheDocument()
  })

  it('shows loading state when session is undefined and page.data.session is also undefined', async () => {
    const pageContext = createMockPageContext({
      data: { session: undefined },
    })

    session.current = undefined
    renderRouteComponent(Layout, {}, pageContext)

    await tick()
    expect(screen.getByText('Loading session...')).toBeInTheDocument()
  })

  it('renders navigation items with correct hrefs', async () => {
    const pageContext = createMockPageContext({
      data: { session: null },
    })

    renderRouteComponent(Layout, {}, pageContext)
    await waitFor(() => {
      expect(screen.getByText('Home')).toHaveAttribute('href', '/')
    })
    expect(screen.getByText('Todos')).toHaveAttribute('href', '/todos')
  })
})
