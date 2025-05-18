// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  namespace App {
    interface PrivateEnv {
      DRIZZLE_LOCAL: boolean
      DATABASE_AUTH_TOKEN: string
      DATABASE_URL: string
      DATABASE_URL_LOCAL: string
      AUTH_SECRET: string
      AUTH_GITHUB_ID: string
      AUTH_GITHUB_SECRET: string
      AUTH_GOOGLE_ID: string
      AUTH_GOOGLE_SECRET: string
    }

    interface PublicEnv {
    }
  }
}

export {}
