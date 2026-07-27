import type { MiddlewareHandler } from "astro"

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

export const onRequest: MiddlewareHandler = (context, next) => {
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
