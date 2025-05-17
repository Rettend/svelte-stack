import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL_LOCAL!,
  },
  dialect: 'turso',
  verbose: true,
  strict: true,
})
