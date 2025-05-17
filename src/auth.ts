import type { SvelteKitAuthConfig } from '@auth/sveltekit'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { env } from '$env/dynamic/private'
// Import your custom GitHub provider
import CustomGitHub from '$lib/github'
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { SvelteKitAuth } from '@auth/sveltekit'

import Google from '@auth/sveltekit/providers/google'

// The GitHubEmail and GitHubProfile interfaces are now defined in $lib/github.ts
// So we don't need to redefine them here.

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
      // Use your custom GitHub provider
      CustomGitHub({
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
        allowDangerousEmailAccountLinking: true, // Keep this if you want auto-linking
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
      async signIn({ user, account, profile }) {
        if (!profile?.email) {
          console.log('[signIn] No profile.email found. Denying sign-in.')
          return false
        }

        console.log('PROFILE from signIn callback', profile)
        console.log('ACCOUNT from signIn callback', account)
        console.log('USER from signIn callback', user)

        if ((account?.type === 'oauth' || account?.type === 'oidc')) {
          if (!profile.email_verified) {
            console.log(`[signIn] ${account.type} account for ${profile.email} (provider: ${account.provider}) but email is NOT verified. Denying sign-in/linking.`)
            return '/auth/error?error=EmailNotVerified'
          }
          console.log(`[signIn] ${account.type} account for ${profile.email} (provider: ${account.provider}) with email_verified: true.`)
        }

        console.log(`[signIn] All checks passed for ${account?.provider}. Returning true.`)
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
  }
  return authOptions
})
