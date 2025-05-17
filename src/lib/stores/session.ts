import type { Session } from '@auth/sveltekit'
import { writable } from 'svelte/store'

export const session = writable<Session | null | undefined>(undefined)
