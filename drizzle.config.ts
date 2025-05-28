import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

const dev = process.env.NODE_ENV === 'development'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: dev
      ? process.env.DATABASE_URL_LOCAL!
      : process.env.DATABASE_URL_REMOTE!,
    authToken: dev ? undefined : process.env.DATABASE_AUTH_TOKEN,
  },
})
