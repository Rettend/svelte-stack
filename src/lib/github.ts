import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers'
import type { TokenSet } from '@auth/core/types'

export interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: 'public' | 'private' | null
}

export interface RawGitHubProfile {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  hireable: boolean | null
  bio: string | null
  twitter_username?: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
  private_gists?: number
  total_private_repos?: number
  owned_private_repos?: number
  disk_usage?: number
  suspended_at?: string | null
  collaborators?: number
  two_factor_authentication: boolean
  plan?: {
    collaborators: number
    name: string
    space: number
    private_repos: number
  }
  enterprise?: {
    baseUrl?: string
  }
  [claim: string]: unknown
}

export interface CustomGitHubAuthProfile {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  email_verified?: boolean | null
}

export default function GitHub(
  config: OAuthUserConfig<RawGitHubProfile> & {
    enterprise?: {
      baseUrl?: string
    }
  },
): OAuthConfig<RawGitHubProfile> {
  const baseUrl = config?.enterprise?.baseUrl ?? 'https://github.com'
  const apiBaseUrl = config?.enterprise?.baseUrl
    ? `${config?.enterprise?.baseUrl}/api/v3`
    : 'https://api.github.com'

  return {
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
    authorization: {
      url: `${baseUrl}/login/oauth/authorize`,
      params: { scope: 'read:user user:email' },
    },
    token: `${baseUrl}/login/oauth/access_token`,
    userinfo: {
      url: `${apiBaseUrl}/user`,
    },
    async profile(profile: RawGitHubProfile, tokens: TokenSet): Promise<CustomGitHubAuthProfile> {
      let finalEmail: string | null = profile.email
      let isVerified = false

      if (tokens.access_token) {
        try {
          const emailsResponse = await fetch(`${apiBaseUrl}/user/emails`, {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'User-Agent': 'authjs-custom-github-provider',
            },
          })

          if (emailsResponse.ok) {
            const emails: GitHubEmail[] = await emailsResponse.json()
            if (emails && emails.length > 0) {
              let chosenEmailEntry: GitHubEmail | undefined

              if (profile.email) {
                const matchedPublicEmail = emails.find(e => e.email === profile.email)
                if (matchedPublicEmail?.verified)
                  chosenEmailEntry = matchedPublicEmail
              }

              if (!chosenEmailEntry)
                chosenEmailEntry = emails.find(e => e.primary && e.verified) ?? emails.find(e => e.verified)

              if (!chosenEmailEntry)
                chosenEmailEntry = emails.find(e => e.primary) ?? emails[0]

              if (chosenEmailEntry) {
                finalEmail = chosenEmailEntry.email
                isVerified = chosenEmailEntry.verified
              }
            }
          }
          else {
            console.error(`[GitHub Provider Profile] Failed to fetch emails. Status: ${emailsResponse.status}`)
          }
        }
        catch (error) {
          console.error('[GitHub Provider Profile] Error fetching user emails:', error)
        }
      }

      return {
        id: profile.id.toString(),
        name: profile.name ?? profile.login,
        email: isVerified ? finalEmail : null,
        image: profile.avatar_url,
        email_verified: isVerified,
      }
    },
    style: { bg: '#24292f', text: '#fff' },
    options: config,
  }
}
