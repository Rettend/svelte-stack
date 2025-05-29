import type { SvelteKitAuthConfig } from '@auth/sveltekit'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { env } from '$env/dynamic/private'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { SvelteKitAuth } from '@auth/sveltekit'
import GitHub from '@auth/sveltekit/providers/github'
import Google from '@auth/sveltekit/providers/google'

export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
  const authOptions: SvelteKitAuthConfig = {
    trustHost: true,
    secret: env.AUTH_SECRET,
    adapter: DrizzleAdapter(db as LibSQLDatabase<typeof schema>, {
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
        allowDangerousEmailAccountLinking: true,
      }),
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    ],
    session: {
      strategy: 'database',
    },
    callbacks: {
      async signIn({ account, profile }) {
        if (account?.provider === 'google') {
          if (!profile?.email_verified)
            return false
        }
        return true
      },
      session({ session, user }) {
        if (user && session.user)
          session.user.id = user.id

        return session
      },
    },
    pages: {
      error: '/auth/error',
    },
    cookies: {
      pkceCodeVerifier: {
        name: 'authjs.pkce_code_verifier',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: false,
        },
      },
      state: {
        name: 'authjs.state',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: false,
        },
      },
      callbackUrl: {
        name: 'authjs.callback-url',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: false,
        },
      },
      sessionToken: {
        name: 'authjs.session-token',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: false,
        },
      },
    },
  }
  return authOptions
})
