import { page } from '$app/state'
import { cleanup, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it } from 'vitest'
import NavItemTestWrapper from './NavItemTestWrapper.svelte'

describe('navItem', () => {
  afterEach(async () => {
    cleanup()
    page.url = new URL('http://localhost/')
    await tick()
  })

  it('renders a link with the correct href and text', async () => {
    page.url = new URL('http://localhost/other')
    render(NavItemTestWrapper, { props: { href: '/test', textContent: 'Test Link' } })
    const link = screen.getByText('Test Link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('applies active styles when current path matches href', async () => {
    page.url = new URL('http://localhost/active')
    render(NavItemTestWrapper, { props: { href: '/active', textContent: 'Active Link' } })
    const link = screen.getByText('Active Link')
    await tick()
    expect(link).toHaveClass('text-primary')
    expect(link).toHaveClass('bg-primary/5')
  })

  it('does not apply active styles when current path does not match href', async () => {
    page.url = new URL('http://localhost/other')
    render(NavItemTestWrapper, { props: { href: '/inactive', textContent: 'Inactive Link' } })
    const link = screen.getByText('Inactive Link')
    await tick()
    expect(link).not.toHaveClass('text-primary')
    expect(link).not.toHaveClass('bg-primary/5')
  })

  it('renders with custom class', async () => {
    page.url = new URL('http://localhost/')
    render(NavItemTestWrapper, { props: { href: '/', textContent: 'Home', consumerClass: 'custom-class' } })
    const link = screen.getByText('Home')
    await tick()
    expect(link).toHaveClass('custom-class')
  })

  it('renders with target and rel attributes', async () => {
    page.url = new URL('http://localhost/')
    render(NavItemTestWrapper, {
      props: {
        href: '/',
        textContent: 'External',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    })
    const link = screen.getByText('External')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
