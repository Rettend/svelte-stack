import type { LayoutLoad } from './$types'
import { trpc } from '$lib/trpc/client'

export const ssr = false

export const load: LayoutLoad = async (event) => {
  trpc({ fetch: event.fetch, url: { origin: event.url.origin } })
  return {}
}
