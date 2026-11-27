export const select = (root, selector) =>
  Array.from(root.querySelectorAll(selector))

export function remove(root, selector) {
  for (const node of select(root, selector)) node.remove()
}

export function island(root, name) {
  return root.querySelector(`astro-island[component-url*="/${name}."]`)
}

// Card anchors wrap whole headings and paragraphs in HTML. In Markdown the
// link belongs on the title, with the metadata and description below it.
export function splitCardLinks({ document, content }) {
  for (const anchor of select(content, "a[href]")) {
    if (anchor.closest("pre, code")) continue
    const title =
      anchor.querySelector("h2, h3, h4") ??
      anchor.querySelector("p, strong, span.block.font-semibold")
    if (!title) continue
    const link = document.createElement("a")
    link.setAttribute("href", anchor.getAttribute("href"))
    link.innerHTML = title.innerHTML
    title.textContent = ""
    title.appendChild(link)
    const block = document.createElement("div")
    block.innerHTML = anchor.innerHTML
    anchor.parentNode.replaceChild(block, anchor)
  }
}

export function discardIslands(context, names) {
  for (const name of names)
    remove(context.content, `astro-island[component-url*="/${name}."]`)
}

export function listLinks(document, links) {
  if (!links.length) return
  const list = document.createElement("ul")
  links[0].parentNode.insertBefore(list, links[0])
  for (const link of links) {
    list.appendChild(document.createElement("li")).appendChild(link)
  }
}

export function stripHeadingPermalinks(content) {
  for (const link of select(
    content,
    'h2 a[href^="#"], h3 a[href^="#"], h4 a[href^="#"]'
  )) {
    if (link.textContent.trim() === "#") link.remove()
  }
}
