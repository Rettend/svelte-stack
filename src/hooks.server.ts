import type { Handle } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { handle as authHandle } from '$lib/server/auth'

export const handle: Handle = async ({ event, resolve }) => {
  const response = await authHandle({ event, resolve })

  if (dev && response.headers.get('content-type')?.startsWith('text/html')) {
    let body = await response.text()
    body = body.replace('<body', '<body data-app-env="dev"')
    body = body.replace('%APP_DEV_MODE_PLACEHOLDER%', dev.toString())

    const newHeaders = new Headers(response.headers)
    newHeaders.delete('content-length')

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }

  return response
}
