// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  namespace App {
    interface Platform {
      env: {
        DRIZZLE_LOCAL: boolean
        DATABASE_URL: string
        DATABASE_AUTH_TOKEN: string
        AUTH_SECRET: string
        AUTH_GITHUB_ID: string
        AUTH_GITHUB_SECRET: string
      }
    }
  }
}

export {}
