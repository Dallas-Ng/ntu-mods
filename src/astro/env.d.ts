/// <reference types="astro/client" />

// Deliberately minimal and hand-written rather than pulling in
// @cloudflare/workers-types — that package redeclares global Response/fetch/
// Request, which collides with the "dom" lib the client React code relies on
// through this same tsconfig.json.
interface WorkerEnv {
  ASSETS: {
    fetch(input: string | URL | Request): Promise<Response>
  }
  // Per-module slices of the semester indexes/metadata files — see
  // src/lib/server/edge/get-module-snapshot.ts for the key shape.
  MODULE_DATA?: {
    get<T>(key: string, type: "json"): Promise<T | null>
  }
  RESEND_KEY?: string
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
