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
      }),
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
    ],
    session: {
      strategy: 'database',
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (!account || !profile?.email) {
          console.log('[signIn] No account or profile.email, allowing (e.g., credentials).')
          return true
        }

        console.log(`[signIn] Attempting with: ${account.provider}, email: ${profile.email}. Current session user:`, user ? { id: user.id, email: user.email } : null)

        const existingUserByEmail = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, profile.email!),
        })
        console.log('[signIn] Query for existingUserByEmail result:', existingUserByEmail ? { id: existingUserByEmail.id, email: existingUserByEmail.email } : null)

        if (existingUserByEmail) {
          if (user && user.id === existingUserByEmail.id) {
            console.log(`[signIn] CASE 1: User ${user.id} (email ${user.email}) is ALREADY LOGGED IN.`)
            console.log(`[signIn] CASE 1: Attempting to process provider: ${account.provider} for this logged-in user.`)
            console.log(`[signIn] CASE 1: The email ${profile.email} matches the logged-in user and existingUserByEmail.`)
            return true
          }
          else {
            const providerAlreadyLinkedToThisEmailUser = await db.query.accounts.findFirst({
              where: (accounts, { and, eq }) => and(
                eq(accounts.userId, existingUserByEmail.id),
                eq(accounts.provider, account.provider),
              ),
            })

            if (providerAlreadyLinkedToThisEmailUser) {
              console.log(`[signIn] CASE 2a: Email ${profile.email} exists. User signing in with an already linked provider ${account.provider} for user ${existingUserByEmail.id}. Allowing normal sign-in.`)
              return true
            }
            else {
              const params = new URLSearchParams({
                error: 'AccountExistsSignInToLink',
                email: profile.email,
                providerToLink: account.provider,
              })
              console.log(`[signIn] CASE 2b: Email ${profile.email} exists (user ${existingUserByEmail.id}), but current session user is different/null. Provider ${account.provider} is new for this email. Redirecting to link prompt.`)
              return `/auth/link-account-prompt?${params.toString()}`
            }
          }
        }
        else {
          console.log(`[signIn] CASE 3: No user found with email ${profile.email}. Proceeding with new user creation for provider ${account.provider}.`)
          return true
        }
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
  }
  return authOptions
})
