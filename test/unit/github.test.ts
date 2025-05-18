import type { OAuthUserConfig } from '@auth/core/providers'
import type { TokenSet } from '@auth/core/types'
import type { CustomGitHubAuthProfile, GitHubEmail, RawGitHubProfile } from '../../src/lib/github' // Adjust path as needed
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GitHub from '../../src/lib/github'

globalThis.fetch = vi.fn()

describe('gitHub Provider', () => {
  const mockConfig: OAuthUserConfig<RawGitHubProfile> = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  }

  const githubProvider = GitHub(mockConfig)

  const mockTokens: TokenSet = {
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_at: Date.now() + 3600,
  }

  const baseMockProfile: RawGitHubProfile = {
    login: 'testuser',
    id: 12345,
    node_id: 'node_id_123',
    avatar_url: 'http://example.com/avatar.png',
    gravatar_id: null,
    url: 'http://example.com/testuser',
    html_url: 'http://example.com/testuser',
    followers_url: '',
    following_url: '',
    gists_url: '',
    starred_url: '',
    subscriptions_url: '',
    organizations_url: '',
    repos_url: '',
    events_url: '',
    received_events_url: '',
    type: 'User',
    site_admin: false,
    name: 'Test User',
    company: null,
    blog: null,
    location: null,
    email: 'public-profile-email@example.com', // Initial email from profile
    hireable: null,
    bio: null,
    public_repos: 0,
    public_gists: 0,
    followers: 0,
    following: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    two_factor_authentication: false,
  }

  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset()
  })

  describe('profile function', () => {
    it('should return profile with verified primary email from /user/emails', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'other@example.com', primary: false, verified: true, visibility: 'public' },
        { email: 'primary-verified@example.com', primary: true, verified: true, visibility: 'private' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profile: CustomGitHubAuthProfile = await githubProvider.profile(baseMockProfile, mockTokens)

      expect(globalThis.fetch).toHaveBeenCalledWith('https://api.github.com/user/emails', expect.any(Object))
      expect(profile.email).toBe('primary-verified@example.com')
      expect(profile.email_verified).toBe(true)
      expect(profile.name).toBe('Test User')
      expect(profile.image).toBe(baseMockProfile.avatar_url)
    })

    it('should use verified public profile email if it matches an entry in /user/emails', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: baseMockProfile.email as string, primary: false, verified: true, visibility: 'public' },
        { email: 'another-verified@example.com', primary: true, verified: true, visibility: 'private' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: 'public-profile-email@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBe('public-profile-email@example.com')
      expect(profile.email_verified).toBe(true)
    })

    it('should fallback to any verified email if primary or public profile email not suitable', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'unverified-primary@example.com', primary: true, verified: false, visibility: 'private' },
        { email: 'any-verified@example.com', primary: false, verified: true, visibility: 'public' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: 'unverified-profile@example.com' } // Profile email is not in /user/emails or not verified
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBe('any-verified@example.com')
      expect(profile.email_verified).toBe(true)
    })

    it('should use login as name if profile.name is null', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'verified@example.com', primary: true, verified: true, visibility: 'public' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, name: null, login: 'username-login' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)
      expect(profile.name).toBe('username-login')
    })

    it('should return email as null if no verified email is found', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'unverified1@example.com', primary: true, verified: false, visibility: 'private' },
        { email: 'unverified2@example.com', primary: false, verified: false, visibility: 'public' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: 'unverified-profile-email@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBeNull()
      expect(profile.email_verified).toBe(false)
    })

    it('should return email as null if /user/emails fetch fails', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server Error' }),
      } as Response)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const profile: CustomGitHubAuthProfile = await githubProvider.profile(baseMockProfile, mockTokens)

      expect(profile.email).toBeNull() // Because baseMockProfile.email is not verified by default by the logic
      expect(profile.email_verified).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[GitHub Provider Profile] Failed to fetch emails'))
      consoleErrorSpy.mockRestore()
    })

    it('should use enterprise URLs if configured', async () => {
      const enterpriseConfig: OAuthUserConfig<RawGitHubProfile> & { enterprise?: { baseUrl?: string } } = {
        clientId: 'ent-client-id',
        clientSecret: 'ent-client-secret',
        enterprise: {
          baseUrl: 'https://github.example.com',
        },
      }
      const enterpriseProvider = GitHub(enterpriseConfig)
      const mockEmails: GitHubEmail[] = [
        { email: 'enterprise-verified@example.com', primary: true, verified: true, visibility: 'public' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      await enterpriseProvider.profile(baseMockProfile, mockTokens)
      expect(globalThis.fetch).toHaveBeenCalledWith('https://github.example.com/api/v3/user/emails', expect.any(Object))
    })

    it('should return email as null and email_verified as false if access_token is missing', async () => {
      const tokensWithoutAccessToken: TokenSet = { ...mockTokens, access_token: undefined }
      // No fetch should be called for /user/emails
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [], // Should not be reached
      } as Response)

      const profileData = { ...baseMockProfile, email: 'some-email@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, tokensWithoutAccessToken)

      expect(globalThis.fetch).not.toHaveBeenCalledWith('https://api.github.com/user/emails', expect.any(Object))
      expect(profile.email).toBeNull()
      expect(profile.email_verified).toBe(false)
      expect(profile.name).toBe(baseMockProfile.name)
      expect(profile.image).toBe(baseMockProfile.avatar_url)
    })

    it('should return email as null if /user/emails returns an empty array', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [], // Empty array
      } as Response)

      const profileData = { ...baseMockProfile, email: 'public-profile-email@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(globalThis.fetch).toHaveBeenCalledWith('https://api.github.com/user/emails', expect.any(Object))
      expect(profile.email).toBeNull()
      expect(profile.email_verified).toBe(false)
    })

    it('should use primary verified email when profile.email is null', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'primary-verified@example.com', primary: true, verified: true, visibility: 'private' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: null }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBe('primary-verified@example.com')
      expect(profile.email_verified).toBe(true)
    })

    it('should use primary verified email from /user/emails if profile.email is set but not in /user/emails list', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'primary-verified@example.com', primary: true, verified: true, visibility: 'private' },
        { email: 'other-verified@example.com', primary: false, verified: true, visibility: 'public' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: 'profile-email-not-in-list@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBe('primary-verified@example.com')
      expect(profile.email_verified).toBe(true)
    })

    it('should prioritize primary verified email from /user/emails over a non-verified profile.email found in /user/emails', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'profile-email-unverified@example.com', primary: false, verified: false, visibility: 'public' },
        { email: 'primary-verified@example.com', primary: true, verified: true, visibility: 'private' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: 'profile-email-unverified@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBe('primary-verified@example.com')
      expect(profile.email_verified).toBe(true)
    })

    it('should use another verified email if profile.email (in list, unverified) and primary email (in list, unverified) are not suitable', async () => {
      const mockEmails: GitHubEmail[] = [
        { email: 'profile-email-unverified@example.com', primary: false, verified: false, visibility: 'public' },
        { email: 'primary-unverified@example.com', primary: true, verified: false, visibility: 'private' },
        { email: 'another-verified@example.com', primary: false, verified: true, visibility: 'public' },
      ]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      } as Response)

      const profileData = { ...baseMockProfile, email: 'profile-email-unverified@example.com' }
      const profile: CustomGitHubAuthProfile = await githubProvider.profile(profileData, mockTokens)

      expect(profile.email).toBe('another-verified@example.com')
      expect(profile.email_verified).toBe(true)
    })
  })
})
