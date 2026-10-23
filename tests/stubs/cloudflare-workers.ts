// Stands in for the virtual `cloudflare:workers` module in unit tests (see the
// alias in vitest.config.ts). Tests set the bindings they need on `env`.
export const env: Record<string, unknown> = {}
export const waitUntil = (_promise: Promise<unknown>) => {}
