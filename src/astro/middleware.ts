import type { MiddlewareHandler } from "astro"

// Cloudflare Workers Builds preview URLs (*.workers.dev) were gated by a
// Cloudflare Access policy that forces an email OTP login on every visit.
// This replaces that with a single hardcoded password so preview links stay
// gated but don't require email. Only "ntumods.com" (production) and
// localhost (dev) skip the gate — any other hostname is treated as preview.
// The cookie stores an opaque token, never the password itself, so it can't
// be read back out of devtools/cookie storage.
const PROD_HOSTNAME = "ntumods.com"
const PREVIEW_PASSWORD = "D!123123!"
const PREVIEW_AUTH_COOKIE = "preview_auth"
const PREVIEW_AUTH_TOKEN = "granted"
const PREVIEW_AUTH_PATH = "/__preview-auth"

function isPreviewDeployment(hostname: string) {
  return hostname !== PROD_HOSTNAME && hostname !== "localhost"
}

function renderAuthPage(error: boolean, redirect: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Preview access</title>
<style>
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; background: #0a0a0a; color: #fafafa; }
  form { display: flex; flex-direction: column; gap: 12px; width: 260px; }
  input { padding: 10px 12px; border-radius: 6px; border: 1px solid #333; background: #171717; color: #fafafa; font-size: 14px; }
  button { padding: 10px 12px; border-radius: 6px; border: none; background: #fafafa; color: #0a0a0a; font-weight: 600; cursor: pointer; }
  p.error { color: #f87171; font-size: 13px; margin: 0; }
</style>
</head>
<body>
<form method="POST" action="${PREVIEW_AUTH_PATH}">
  <input type="hidden" name="redirect" value="${redirect.replace(/"/g, "&quot;")}">
  ${error ? '<p class="error">Wrong password.</p>' : ""}
  <input type="password" name="password" placeholder="Preview password" autofocus>
  <button type="submit">Enter</button>
</form>
</body>
</html>`
}

// Module pages are prerendered under their canonical uppercase code only, so a
// lowercase URL would otherwise hard-404. Next used to normalise these with a
// 308 inside the route itself; that isn't possible on a prerendered route, so
// it happens here instead — the request only reaches the worker when no static
// asset matched, which is exactly the lowercase case.
//
// Covers both /mods/:code and /mods/:code/:year/:semester.
//
// Segments are strictly alphanumeric. Module codes and term identifiers always
// are, and the narrow pattern also keeps this off paths that only look like
// module URLs — in particular the build-time pass, where prerendering a page
// under `build.format: "file"` presents its own output path (/mods/SC1003.html)
// to middleware and a looser pattern would "normalise" the file extension.
const MODULE_PATH = /^\/mods\/([A-Za-z0-9]+)((?:\/[A-Za-z0-9]+)*)$/

export const onRequest: MiddlewareHandler = async (context, next) => {
  if (isPreviewDeployment(context.url.hostname)) {
    if (
      context.url.pathname === PREVIEW_AUTH_PATH &&
      context.request.method === "POST"
    ) {
      const form = await context.request.formData()
      const redirect = String(form.get("redirect") || "/")
      if (form.get("password") === PREVIEW_PASSWORD) {
        context.cookies.set(PREVIEW_AUTH_COOKIE, PREVIEW_AUTH_TOKEN, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30
        })
        return context.redirect(redirect, 302)
      }
      return new Response(renderAuthPage(true, redirect), {
        status: 401,
        headers: { "content-type": "text/html" }
      })
    }

    if (
      context.cookies.get(PREVIEW_AUTH_COOKIE)?.value !== PREVIEW_AUTH_TOKEN
    ) {
      const redirect = `${context.url.pathname}${context.url.search}`
      return new Response(renderAuthPage(false, redirect), {
        status: 401,
        headers: { "content-type": "text/html" }
      })
    }
  }

  const match = MODULE_PATH.exec(context.url.pathname)

  if (match) {
    const [, code, rest] = match
    if (code !== code.toUpperCase()) {
      return context.redirect(
        `/mods/${code.toUpperCase()}${rest}${context.url.search}`,
        301
      )
    }
  }

  return next()
}
