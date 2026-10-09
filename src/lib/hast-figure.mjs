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
      const image = (props) => ({
        ...img,
        properties: {
          ...rest,
          alt,
          loading: "lazy",
          decoding: "async",
          ...props
        }
      })
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
