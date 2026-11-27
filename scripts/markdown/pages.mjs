import { siteConfig } from "../../src/config/site.ts"
import { MCP_CLIENTS } from "../../src/lib/developers/mcp-clients.ts"
import { DEV_LINKS } from "../../src/lib/developers/pages.ts"
import { calendar, changelog, modules } from "./catalogues.mjs"
import { apiReference, exams, modulePage } from "./data.mjs"
import {
  discardIslands,
  island,
  listLinks,
  remove,
  select,
  splitCardLinks,
  stripHeadingPermalinks
} from "./html.mjs"

function landing(context) {
  const demo = island(context.content, "landing-demo")
  demo?.closest("section")?.remove()
  discardIslands(context, ["landing-showcase"])
  splitCardLinks(context)
}

function timetable(context) {
  discardIslands(context, ["timetable-page-content"])
  context.append.push(
    "## Open the planner\n\n[Build an NTU timetable](" +
      new URL("/timetable", context.url).href +
      ")."
  )
  splitCardLinks(context)
}

function campusMap(context) {
  discardIslands(context, ["maps-page-content"])
  context.append.push(
    "## Open the map\n\n[Search venues and get walking directions](" +
      context.url.href +
      ")."
  )
}

function sharedTimetable({ url }) {
  return `# Shared NTU timetable

Open the original share link in a browser to view the plan. You can copy a shared plan into your own timetable to edit it.

[Start a new timetable](${new URL("/timetable.md", url).href}).`
}

function wallpaper({ url }) {
  return `# NTU timetable wallpaper maker

Add modules in the [timetable planner](${new URL("/timetable.md", url).href}), then open the [wallpaper maker](${url.href}) in the same browser. Pick a phone preset or customise the layout, then export an image.

The wallpaper maker uses the timetable saved in your browser.`
}

function feedback(context) {
  discardIslands(context, ["feedback-card"])
  context.append.push(
    `## Send feedback\n\n[Open the feedback form](${context.url.href}). You can include an email address for a reply.`
  )
}

function debug(context) {
  discardIslands(context, ["debug-content"])
  context.append.push(
    `Open the [debug page](${context.url.href}) in your browser to inspect local data. Resetting clears all local timetable data.`
  )
}

function gradeTool(component, instructions) {
  return (context) => {
    discardIslands(context, [component])
    splitCardLinks(context)
    context.append.push(
      `## How to use it\n\n${instructions}\n\n[Open the tool](${context.url.href}).`
    )
  }
}

function article(context) {
  discardIslands(context, ["article-toc", "article-view-tracker"])
  splitCardLinks(context)
}

function articleCatalogue(context) {
  for (const title of select(context.content, 'a[href^="/articles/"] h2')) {
    const metadata = title.previousElementSibling
    if (!metadata || metadata.tagName !== "DIV") continue
    metadata.textContent = Array.from(metadata.children, (item) =>
      item.textContent.trim()
    )
      .filter(Boolean)
      .join(" · ")
    title.parentNode.insertBefore(metadata, title.nextSibling)
  }
  splitCardLinks(context)
}

function sitemap(context) {
  const { document, content } = context
  remove(content, 'a[href^="#modules-"]')
  for (const group of select(content, 'section[id^="modules-"]')) {
    listLinks(document, select(group, 'a[href^="/mods/"]'))
  }
  splitCardLinks(context)
}

function studentLinks(context) {
  stripHeadingPermalinks(context.content)
  splitCardLinks(context)
}

function tools(context) {
  discardIslands(context, ["tools-grid"])
  splitCardLinks(context)
  context.append.push("## Tools")
  for (const tool of siteConfig.tools) {
    const target = new URL(tool.href, context.url)
    target.pathname += ".md"
    context.append.push(`### [${tool.name}](${target.href})\n\n${tool.desc}`)
    if (tool.guide && tool.guide.href !== tool.href) {
      context.append.push(
        `[${tool.guide.label}](${new URL(tool.guide.href, context.url).href})`
      )
    }
  }
}

function developerDocs(context) {
  discardIslands(context, [
    "article-toc",
    "side-nav-drawer",
    "assistant-preview",
    "github-stars"
  ])
  // The hash icon is a visual permalink. Keep the heading text and let
  // Markdown consumers generate their own heading anchors.
  stripHeadingPermalinks(context.content)
  splitCardLinks(context)
}

async function developerReference(context) {
  developerDocs(context)
  await apiReference(context)
}

// Ordered FAQ and policy prose already has semantic section markup. Giving
// it an explicit profile keeps a new interactive page from silently using it.
function prose({ content }) {
  remove(content, "form")
}

const pages = new Map([
  ...DEV_LINKS.map(({ href }) => [href, developerDocs]),
  ...MCP_CLIENTS.map(({ id }) => [`/developers/mcp/${id}`, developerDocs]),
  ["/", landing],
  ["/ai-instructions", prose],
  ["/articles", articleCatalogue],
  ["/calendar", calendar],
  ["/changelog", changelog],
  ["/debug", debug],
  ["/developers/api", developerReference],
  ["/developers/discovery", developerReference],
  ["/exams", exams],
  ["/faq", prose],
  ["/feedback", feedback],
  ["/links", studentLinks],
  ["/maps", campusMap],
  ["/mods", modules],
  ["/privacy", prose],
  ["/screenshot", wallpaper],
  ["/share", sharedTimetable],
  ["/sitemap", sitemap],
  ["/terms", prose],
  ["/timetable", timetable],
  ["/tools", tools],
  [
    "/tools/cgpa-planner",
    gradeTool(
      "cgpa-planner",
      "Enter your CGPA and completed and remaining letter-graded academic units, or import a transcript. Pick an honours class to see the average grade you need."
    )
  ],
  [
    "/tools/fgo-optimiser",
    gradeTool(
      "fgo-optimiser",
      "Import your transcript or Degree Audit, choose the applicable Flexible Grading Option quota, and run Auto-optimise. Review the selected courses and projected CGPA before applying through NTU."
    )
  ]
])

export function renderPage(context) {
  const { page } = context
  const render =
    pages.get(page) ??
    (/^\/mods\/[^/]+$/.test(page) ? modulePage : undefined) ??
    (/^\/articles\/[^/]+$/.test(page) ? article : undefined)
  if (!render) throw new Error(`No Markdown renderer for ${page}`)
  return render(context)
}
