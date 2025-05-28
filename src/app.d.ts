// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  namespace App {
    interface PrivateEnv {
      NODE_ENV: string
      DATABASE_URL_LOCAL: string
      DATABASE_URL_REMOTE: string
      DATABASE_AUTH_TOKEN: string
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
