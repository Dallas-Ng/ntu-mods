/// <reference types="astro/client" />

// Deliberately minimal and hand-written rather than pulling in
// @cloudflare/workers-types — that package redeclares global Response/fetch/
// Request, which collides with the "dom" lib the client React code relies on
// through this same tsconfig.json.
// Only the surface actually used is declared. Bind parameters are `unknown`
// rather than a D1 value union because every call site passes strings.
interface D1Result<T> {
  results?: T[]
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T>(): Promise<T | null>
  all<T>(): Promise<D1Result<T>>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
}

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

interface WorkerEnv {
  ASSETS: {
    fetch(input: string | URL | Request): Promise<Response>
  }
  // Source of truth for module data. Optional because it is absent in local
  // dev runs that have no remote binding configured.
  DB?: D1Database
  RESEND_KEY?: string
  // Workers Rate Limiting bindings; absent in local dev.
  MODULE_API_LIMITER?: RateLimiter
  FEEDBACK_LIMITER?: RateLimiter
  VIEWS_LIMITER?: RateLimiter
  WALK_LIMITER?: RateLimiter
  PUBLIC_POSTHOG_TOKEN?: string
}

declare module "cloudflare:workers" {
  export const env: WorkerEnv
  export function waitUntil(promise: Promise<unknown>): void
}

interface ImportMetaEnv {
  readonly PUBLIC_POSTHOG_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
