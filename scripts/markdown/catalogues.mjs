export function calendar({ document, content }) {
  const weekdays = ["Week", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  for (const grid of Array.from(
    content.querySelectorAll('[data-calendar-card] [role="grid"]')
  )) {
    const table = document.createElement("table")
    const head = table.appendChild(document.createElement("thead"))
    const heading = head.appendChild(document.createElement("tr"))
    for (const day of weekdays) {
      const cell = document.createElement("th")
      cell.textContent = day
      heading.appendChild(cell)
    }
    const body = table.appendChild(document.createElement("tbody"))
    for (const row of Array.from(grid.querySelectorAll('[role="row"]')).slice(
      1
    )) {
      const outputRow = body.appendChild(document.createElement("tr"))
      for (const cell of Array.from(row.children)) {
        const label = cell.getAttribute("aria-label")
        outputRow.appendChild(document.createElement("td")).textContent =
          cell.getAttribute("role") === "rowheader" &&
          label !== "Outside the semester"
            ? (label ?? cell.textContent.trim())
            : cell.textContent.trim()
      }
    }
    grid.replaceWith(table)
  }
  for (const button of Array.from(
    content.querySelectorAll('[data-calendar-card="dates"] li button')
  )) {
    const date = button.querySelector("span > span")
    if (date) date.textContent += " | "
    button.replaceWith(...Array.from(button.childNodes))
  }
}

export function modules({ content }) {
  // Keep the catalogue's title and semester. Its grouped directory below
  // already lists the full set of modules, including the preview cards.
  const header = content.querySelector("h1")?.parentElement
  const island = header?.closest("astro-island")
  if (island) island.parentNode.replaceChild(header.cloneNode(true), island)
  for (const count of Array.from(content.querySelectorAll("summary > span"))) {
    count.before(" ")
  }
}

export function changelog({ document, content }) {
  for (const badge of Array.from(
    content.querySelectorAll("[data-markdown-label]")
  )) {
    const label = document.createElement("strong")
    label.textContent = badge.textContent
    badge.replaceWith(label, " | ")
  }
  for (const heading of Array.from(
    content.querySelectorAll("[data-markdown-subheading]")
  )) {
    const subheading = document.createElement("h3")
    subheading.innerHTML = heading.innerHTML
    heading.replaceWith(subheading)
  }
}
