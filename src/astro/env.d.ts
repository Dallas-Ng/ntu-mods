/// <reference types="astro/client" />

// Deliberately minimal, module-scoped (not `@cloudflare/workers-types`) —
// that package redeclares global Response/fetch/Request, which would
// collide with the "dom" lib the coexisting Next.js app still relies on
// in this shared tsconfig.json.
declare module "cloudflare:workers" {
  export const env: {
    ASSETS: {
      fetch(input: string | URL | Request): Promise<Response>
    }
  }
}
