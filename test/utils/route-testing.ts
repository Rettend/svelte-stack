import type { Session } from '@auth/sveltekit'
import { page as globalMockedAppPage } from '$app/state'
import { render } from '@testing-library/svelte'

export interface MockPageData {
  session?: Session | null | undefined
  [key: string]: any
}

export interface MockPageContext {
  url?: URL
  params?: Record<string, string>
  route?: { id: string | null }
  data?: MockPageData
}

export function createMockPageContext(overrides: MockPageContext = {}): MockPageContext {
  return {
    url: new URL('http://localhost/'),
    params: {},
    route: { id: null },
    data: {},
    ...overrides,
  }
}

export function renderRouteComponent(component: any, props: any = {}, pageContext: MockPageContext = {}) {
  const mockContext = createMockPageContext(pageContext)

  if (mockContext.url !== undefined)
    globalMockedAppPage.url = mockContext.url
  if (mockContext.data !== undefined)
    globalMockedAppPage.data = mockContext.data
  if (mockContext.params !== undefined)
    globalMockedAppPage.params = mockContext.params
  if (mockContext.route !== undefined)
    globalMockedAppPage.route = mockContext.route

  const result = render(component, { props })

  return {
    ...result,
    mockPage: globalMockedAppPage,
  }
}
