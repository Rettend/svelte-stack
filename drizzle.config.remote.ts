import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dbCredentials: {
    url: process.env.DRIZZLE_LOCAL! ? process.env.DATABASE_URL_LOCAL! : process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  dialect: 'turso',
  verbose: true,
  strict: true,
})
