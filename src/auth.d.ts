import type { DefaultSession, User as DefaultUser } from '@auth/core/types'

declare module '@auth/core/types' {
  /**
   * Returned by `auth()` (GET sessions) and `signIn()` (POST requests),
   * when using JWTs or database sessions.
   */
  interface User extends DefaultUser {
    /**
     * Custom property added by our GitHub provider to indicate email verification status.
     * This matches the 'email_verified' field from our CustomGitHubAuthProfile.
     */
    email_verified?: boolean | null
  }

  /**
   * Returned by `auth()` (GET sessions) and `update()` (PUT session data),
   * when using database sessions.
   */
  interface Session extends DefaultSession {
    user?: {
      id?: string | null
      name?: string | null
      email?: string | null
      image?: string | null
      /** Custom property for email verification status. */
      email_verified?: boolean | null
    } & DefaultSession['user']
  }
}
