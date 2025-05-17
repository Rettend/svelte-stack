/* eslint-disable no-console */
import process from 'node:process'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../src/lib/server/db/schema'

const client = createClient({
  url: process.env.DRIZZLE_LOCAL ? process.env.DATABASE_URL_LOCAL : process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

async function printAllTables() {
  const tables = [
    { name: 'account', table: schema.accounts },
    { name: 'authenticator', table: schema.authenticators },
    { name: 'session', table: schema.sessions },
    { name: 'user', table: schema.users },
    { name: 'verificationToken', table: schema.verificationTokens },
  ]

  for (const { name, table } of tables) {
    console.log(`\nTable: ${name}`)
    const data = await db.select().from(table)
    console.log(JSON.stringify(data))
  }

  client.close()
}

printAllTables()
