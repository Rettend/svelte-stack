import { describe, expect, it, vi } from 'vitest'

describe('layout Server Load', () => {
  it('should return session data', async () => {
    const mockSession = {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31T23:59:59Z',
    }

    const mockEvent = {
      locals: {
        auth: vi.fn().mockResolvedValue(mockSession),
      },
    }

    const { load } = await import('../../src/routes/+layout.server')
    const result = await load(mockEvent as any)

    expect(result).toEqual({ session: mockSession })
    expect(mockEvent.locals.auth).toHaveBeenCalledTimes(1)
  })

  it('should handle null session', async () => {
    const mockEvent = {
      locals: {
        auth: vi.fn().mockResolvedValue(null),
      },
    }

    const { load } = await import('../../src/routes/+layout.server')
    const result = await load(mockEvent as any)

    expect(result).toEqual({ session: null })
  })
})

describe('layout Client Configuration', () => {
  it('should disable SSR', async () => {
    const layoutConfig = await import('../../src/routes/+layout')
    expect(layoutConfig.ssr).toBe(false)
  })
})
