import { env } from "cloudflare:workers"

type LimiterName =
  "MODULE_API_LIMITER" | "FEEDBACK_LIMITER" | "VIEWS_LIMITER" | "WALK_LIMITER"

/**
 * 429 when this IP is over the named Workers Rate Limiting binding, else null.
 * A missing binding (local dev) never limits.
 * ponytail: limits are per Cloudflare location; add a WAF rule for a global cap.
 */
export async function rateLimit(
  name: LimiterName,
  request: Request
): Promise<Response | null> {
  const limiter = env[name]
  if (!limiter) return null
  const key = request.headers.get("cf-connecting-ip") ?? "unknown"
  const { success } = await limiter.limit({ key })
  if (success) return null
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Retry in a minute." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Retry-After": "60",
        "Cache-Control": "no-store"
      }
    }
  )
}

/**
 * Browsers always send Origin on cross-site POSTs. Reject one that is not this
 * site; requests without Origin (curl, server code) pass and are left to the
 * rate limit.
 */
export function isCrossSite(request: Request): boolean {
  const origin = request.headers.get("origin")
  return !!origin && origin !== new URL(request.url).origin
}

/** True when the declared body is larger than `max` bytes. */
export const bodyTooLarge = (request: Request, max: number): boolean =>
  Number(request.headers.get("content-length") ?? 0) > max
