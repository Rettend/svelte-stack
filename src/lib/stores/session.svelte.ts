import type { Session } from '@auth/sveltekit'

interface SessionStore {
  current: Session | null | undefined
}

export const session = $state<SessionStore>({
  current: undefined,
})
