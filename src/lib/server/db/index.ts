import { env } from '$env/dynamic/private'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const dev = env.NODE_ENV === 'development'

if (dev) {
  if (!env.DATABASE_URL_LOCAL)
    throw new Error('DATABASE_URL_LOCAL is not set for development')
}
else {
  if (!env.DATABASE_URL_REMOTE)
    throw new Error('DATABASE_URL_REMOTE is not set for production')
  if (!env.DATABASE_AUTH_TOKEN)
    throw new Error('DATABASE_AUTH_TOKEN is not set for production')
}

const client = createClient({
  url: dev ? env.DATABASE_URL_LOCAL : env.DATABASE_URL_REMOTE,
  authToken: dev ? undefined : env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(client, { schema, logger: dev })
