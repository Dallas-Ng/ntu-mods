/**
 * Sätteri hast plugin: wraps a lone markdown image in <figure>, with a
 * <figcaption> that is always present: the image's title
 * (`![alt](src "caption")`), else its alt text. A visible caption next to the
 * image is an image-search signal and keeps screenshots readable without
 * zooming. Also lazy-loads and async-decodes the image; the title is dropped so
 * it does not double as a hover tooltip.
 *
 * Theme support: if `public/<name>-dark.<ext>` exists beside a `/articles/`
 * image, both are emitted and globals.css shows the one matching the active
 * theme (`.img-light` / `.img-dark`).
 */
import fs from "node:fs"
import path from "node:path"

const isBlank = (node) => node.type === "text" && !node.value.trim()

/** Pixel size of a /articles/*.webp, read from its header (no image dependency).
 *  Written as width/height so the browser reserves the space before the image
 *  loads, and a theme swap between same-sized light/dark twins never reflows. */
const webpSize = (src) => {
  try {
    const fd = fs.openSync(path.join(process.cwd(), "public", src), "r")
    const b = Buffer.alloc(32)
    fs.readSync(fd, b, 0, 32, 0)
    fs.closeSync(fd)
    if (b.toString("ascii", 8, 12) !== "WEBP") return null
    const kind = b.toString("ascii", 12, 16)
    if (kind === "VP8 ")
      return {
        width: b.readUInt16LE(26) & 0x3fff,
        height: b.readUInt16LE(28) & 0x3fff
      }
    if (kind === "VP8L") {
      const v = b.readUInt32LE(21)
      return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }
    }
    if (kind === "VP8X")
      return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 }
  } catch {}
  return null
}

const darkVariant = (src) => {
  if (typeof src !== "string" || !src.startsWith("/articles/")) return null
  const dark = src.replace(/(\.\w+)$/, "-dark$1")
  return dark !== src && fs.existsSync(path.join(process.cwd(), "public", dark))
    ? dark
    : null
}

export default {
  name: "figure-captions",
  element: {
    filter: ["p"],
    visit(node, ctx) {
      const kids = node.children.filter((c) => !isBlank(c))
      const img = kids[0]
      if (kids.length !== 1 || img.type !== "element" || img.tagName !== "img")
        return
      const { alt = "", title, ...rest } = img.properties
      const caption = String(title || alt).trim()
      const dark = darkVariant(rest.src)
      const image = (props) => {
        const src = props.src ?? rest.src
        return {
          ...img,
          properties: {
            ...rest,
            alt,
            loading: "lazy",
            decoding: "async",
            ...(typeof src === "string" ? webpSize(src) : null),
            ...props
          }
        }
      }
      ctx.replaceNode(node, {
        type: "element",
        tagName: "figure",
        properties: {},
        children: [
          ...(dark
            ? [
                image({ className: ["img-light"] }),
                image({ src: dark, className: ["img-dark"] })
              ]
            : [image({})]),
          ...(caption
            ? [
                {
                  type: "element",
                  tagName: "figcaption",
                  properties: {},
                  children: [{ type: "text", value: caption }]
                }
              ]
            : [])
        ]
      })
    }
  }
}
