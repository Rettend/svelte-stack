import { cleanup } from '@testing-library/svelte'
import { afterEach, vi } from 'vitest'
import '@testing-library/svelte/vitest'
import '@testing-library/jest-dom/vitest'

interface TestFriendlyPage {
  url: URL
  data: object
  params: object
  route: { id: string | null }
  status: number
  error: Error | null
  form: any | null
}

vi.mock('$app/state', (): { page: TestFriendlyPage } => {
  const mockPageState: TestFriendlyPage = {
    url: new URL('http://localhost/'),
    data: {},
    params: {},
    route: { id: null },
    status: 200,
    error: null,
    form: null,
  }

  const proxiedPage = new Proxy(mockPageState, {
    get: <K extends keyof TestFriendlyPage>(target: TestFriendlyPage, prop: K): TestFriendlyPage[K] => {
      return target[prop]
    },
    set: <K extends keyof TestFriendlyPage>(target: TestFriendlyPage, prop: K, value: TestFriendlyPage[K]): boolean => {
      target[prop] = value
      return true
    },
  })

  return {
    page: proxiedPage,
  }
})

afterEach(() => {
  cleanup()
})
