import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

import { DIST } from "./urls"

const ASSET = /^\/_astro\/[^"'?#]+\.js$/
const ENTRY_ATTR =
  /(?:\bsrc|\bhref|renderer-url|before-hydration-url)="(\/_astro\/[^"]+\.js)"/g
// client:visible / idle / media islands fetch their component later, so only
// load and only islands count as up-front JS.
const ISLAND = /<astro-island\b[^>]*>/g
// Static `import ... from "./x.js"` and bare `import "./x.js"`; dynamic
// `import("./x.js")` is lazy, so it is deliberately not followed.
const STATIC_IMPORT = /(?:\bfrom\s*|\bimport\s*)["'](\.\/[^"']+\.js)["']/g

export interface JsCost {
  files: string[]
  gzipBytes: number
}

/** Client JS a page loads up front: entry scripts, islands and their static imports. */
export function initialJs(htmlFile: string): JsCost {
  const html = fs.readFileSync(htmlFile, "utf8")
  const islands = [...html.matchAll(ISLAND)]
    .filter((m) => /\bclient="(load|only)"/.test(m[0]))
    .map((m) => /component-url="([^"]+)"/.exec(m[0])?.[1] ?? "")
  const queue = [
    ...[...html.matchAll(ENTRY_ATTR)].map((m) => m[1]),
    ...islands
  ].filter((u) => ASSET.test(u))
  const seen = new Set<string>()
  let gzipBytes = 0
  while (queue.length) {
    const url = queue.pop()!
    if (seen.has(url)) continue
    seen.add(url)
    const file = path.join(DIST, url)
    if (!fs.existsSync(file)) continue
    const code = fs.readFileSync(file)
    gzipBytes += zlib.gzipSync(code).length
    for (const m of code.toString("utf8").matchAll(STATIC_IMPORT)) {
      queue.push(path.posix.join(path.posix.dirname(url), m[1]))
    }
  }
  return { files: [...seen], gzipBytes }
}
