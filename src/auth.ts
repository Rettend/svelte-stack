import { env } from '$env/dynamic/private'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { SvelteKitAuth } from '@auth/sveltekit'
import GitHub from '@auth/sveltekit/providers/github'

export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
  return {
    trustHost: true,
    secret: env.AUTH_SECRET,
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
      authenticatorsTable: schema.authenticators,
    }),
    providers: [
      GitHub({
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
      }),
    ],
    session: {
      strategy: 'database',
    },
    callbacks: {
      session({ session, user }) {
        if (user && session.user)
          session.user.id = user.id

        return session
      },
    },
  }
})
