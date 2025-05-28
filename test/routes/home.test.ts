import { cleanup, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomePage from '../../src/routes/+page.svelte'
import { renderRouteComponent } from '../utils/route-testing'

vi.mock('../../package.json', async () => {
  const actualPackageJson = await vi.importActual('../../package.json')
  return {
    dependencies: actualPackageJson.dependencies,
    devDependencies: actualPackageJson.devDependencies,
    packageManager: actualPackageJson.packageManager,
  }
})

function getVersion(packageName: string, deps: Record<string, string>) {
  const version = deps[packageName]
  return version ? version.replace('^', '').replace('~', '') : undefined
}

describe('home Page', () => {
  const user = userEvent.setup()

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the counter and increment buttons', () => {
    renderRouteComponent(HomePage)

    expect(screen.getByText(/Count: 0/)).toBeInTheDocument()
    expect(screen.getAllByText('Increment')).toHaveLength(5)
  })

  it('displays the tech stack sections', () => {
    renderRouteComponent(HomePage)

    expect(screen.getByText('Tech Stack')).toBeInTheDocument()
    expect(screen.getByText('Core')).toBeInTheDocument()
    expect(screen.getByText('Styling & UI')).toBeInTheDocument()
    expect(screen.getByText('Backend & Database')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('shows technology items with versions', async () => {
    renderRouteComponent(HomePage)

    expect(screen.getByText('Svelte')).toBeInTheDocument()
    expect(screen.getByText('SvelteKit')).toBeInTheDocument()
    expect(screen.getByText('UnoCSS')).toBeInTheDocument()
    expect(screen.getByText('Auth.js')).toBeInTheDocument()
    expect(screen.getByText('Drizzle ORM')).toBeInTheDocument()

    const { devDependencies: mockDevDependencies } = await import('../../package.json')

    const svelteVersion = getVersion('svelte', mockDevDependencies)
    const svelteKitVersion = getVersion('@sveltejs/kit', mockDevDependencies)

    if (svelteVersion)
      expect(screen.getByText(`- v${svelteVersion}`)).toBeInTheDocument()
    else
      throw new Error('Svelte version not found in mockDevDependencies for test')

    if (svelteKitVersion)
      expect(screen.getByText(`- v${svelteKitVersion}`)).toBeInTheDocument()
    else
      throw new Error('SvelteKit version not found in mockDevDependencies for test')
  })

  it('increments counter when buttons are clicked', async () => {
    const { component } = renderRouteComponent(HomePage)

    const incrementButtons = screen.getAllByText('Increment')

    await user.click(incrementButtons[0])

    expect(screen.getByText(/Count: 1/)).toBeInTheDocument()

    expect(component).toBeDefined()
  })
})
