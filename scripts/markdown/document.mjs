import TurndownService from "turndown"
import { gfm } from "turndown-plugin-gfm"

const converter = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced"
})
converter.use(gfm)
converter.addRule("detailsHeading", {
  filter: "summary",
  replacement(content, node) {
    const depth = node.parentElement?.parentElement?.closest("details") ? 3 : 2
    return `\n\n${"#".repeat(depth)} ${content.trim()}\n\n`
  }
})
converter.addRule("singleLineTableCell", {
  filter: ["th", "td"],
  replacement(content, cell) {
    const text = content
      .trim()
      .replace(/\s*\n\s*/g, " ")
      .replaceAll("|", "\\|")
    return `${cell.previousElementSibling ? " " : "| "}${text} |`
  }
})

export function prepareDocument(content) {
  for (const node of Array.from(
    content.querySelectorAll(
      "script, style, template, noscript, svg, nav, [hidden], [aria-hidden=true]:not([role=gridcell]), [role=status], .sr-only"
    )
  )) {
    node.remove()
  }
}

export function renderDocument({
  document,
  content,
  url,
  navigation,
  pageSources
}) {
  for (const node of Array.from(
    content.querySelectorAll(
      "button, input, select, textarea, [role=tablist], h3:empty"
    )
  )) {
    const heading = node.parentElement
    node.remove()
    if (heading?.matches("h3") && !heading.textContent.trim()) heading.remove()
  }
  // The GFM plugin needs a header row. Keep headerless key/value tables as
  // tables by adding generic headers without promoting a data row.
  for (const table of Array.from(content.querySelectorAll("table"))) {
    const first = table.querySelector("tr")
    if (first && !first.querySelector("th")) {
      const head = document.createElement("thead")
      const row = document.createElement("tr")
      Array.from(first.cells).forEach((_, index) => {
        const cell = document.createElement("th")
        cell.textContent =
          first.cells.length === 2
            ? ["Field", "Value"][index]
            : `Column ${index + 1}`
        row.appendChild(cell)
      })
      head.appendChild(row)
      table.insertBefore(head, table.firstChild)
    }
  }
  for (const node of Array.from(
    content.querySelectorAll("a[href], img[src]")
  )) {
    const attribute = node.tagName === "A" ? "href" : "src"
    const value = node.getAttribute(attribute)
    if (!value || value.startsWith("#") || node.closest("pre, code")) continue
    const target = URL.parse(value, url)
    if (!target || target.origin !== url.origin) continue
    const path = target.pathname.replace(/\/$/, "") || "/"
    if (attribute === "href" && navigation.has(path) && pageSources.has(path)) {
      target.pathname = path === "/" ? "/index.md" : `${path}.md`
    }
    node.setAttribute(attribute, target.href)
  }

  const title = document.title.trim()
  const description = document
    .querySelector('meta[name="description"]')
    ?.getAttribute("content")
    ?.trim()
  const heading = content.querySelector("h1")
  const headingMarkdown = heading
    ? converter.turndown(heading.outerHTML)
    : `# ${title || "NTUMods"}`
  heading?.remove()
  const body = converter.turndown(content)
  return [
    headingMarkdown,
    !content.querySelector("p") && description && !body.includes(description)
      ? description
      : "",
    body
  ]
}
