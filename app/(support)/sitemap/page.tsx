import type { Metadata } from "next"
import Link from "next/link"

import moduleMapJson from "@/data/api/module-map.json"
import { siteConfig } from "@/config/site"
import { getAllArticles } from "@/lib/server/articles"
import Header from "@/components/header"

export const dynamic = "force-static"
export const revalidate = false

export const metadata: Metadata = {
  title: siteConfig.metatags.sitemap.title,
  description: siteConfig.metatags.sitemap.desc,
  alternates: { canonical: "/sitemap" }
}

const CORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Timetable", href: "/timetable" },
  { label: "Mods", href: "/mods" },
  { label: "Articles", href: "/articles" },
  { label: "Help", href: "/help" }
]

const TOOL_LINKS = [
  { label: "Wallpaper Maker", href: "/screenshot" },
  { label: "Changelog", href: "/changelog" },
  { label: "Privacy", href: "/privacy" },
  { label: "Settings", href: "/settings" },
  { label: "Report an Issue", href: "/settings#feedback" }
]

const moduleMap = moduleMapJson as Record<string, { title?: string }>

function getModulePrefix(code: string) {
  return code.match(/^[A-Z]+/)?.[0] ?? "#"
}

function getModuleGroups() {
  const groups = new Map<string, Array<{ code: string; title: string }>>()

  Object.entries(moduleMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([code, moduleItem]) => {
      const prefix = getModulePrefix(code)
      const modules = groups.get(prefix) ?? []

      modules.push({
        code,
        title: moduleItem.title ?? code
      })

      groups.set(prefix, modules)
    })

  return Array.from(groups.entries()).map(([prefix, modules]) => ({
    prefix,
    modules
  }))
}

function LinkGrid({
  links
}: {
  links: Array<{ label: string; href: string; description?: string }>
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="hover:bg-muted rounded-md border p-3 transition-colors">
          <span className="text-foreground font-medium">{link.label}</span>

          {link.description && (
            <span className="text-muted-foreground mt-1 block text-sm leading-6">
              {link.description}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

export default function SitemapPage() {
  const articles = getAllArticles()
  const moduleGroups = getModuleGroups()
  const moduleCount = Object.keys(moduleMap).length

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-6 lg:mt-5">
      <Header
        title="Sitemap"
        subtitle={`Browse NTUMods pages, guides, and ${moduleCount.toLocaleString("en-SG")} NTU module pages from one place.`}
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Core Pages</h2>
        <LinkGrid links={CORE_LINKS} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tools and Support</h2>
        <LinkGrid links={TOOL_LINKS} />
      </section>

      {articles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Articles</h2>
          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="text-muted-foreground hover:text-blue-500 text-sm leading-6 transition-colors">
                <span className="text-foreground font-medium">
                  {article.title}
                </span>
                {article.description && (
                  <> &mdash; {article.description}</>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Modules</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Module pages are grouped by course code prefix.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {moduleGroups.map((group) => (
            <Link
              key={group.prefix}
              href={`#modules-${group.prefix.toLowerCase()}`}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md border px-2 py-1 text-sm transition-colors">
              {group.prefix}
            </Link>
          ))}
        </div>

        <div className="space-y-8">
          {moduleGroups.map((group) => (
            <section
              id={`modules-${group.prefix.toLowerCase()}`}
              key={group.prefix}
              className="scroll-mt-20 border-t pt-6">
              <h3 className="text-lg font-semibold">{group.prefix}</h3>

              <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.modules.map((moduleItem) => (
                  <Link
                    key={moduleItem.code}
                    href={`/mods/${moduleItem.code}`}
                    className="text-muted-foreground hover:text-blue-500 text-sm leading-6 transition-colors">
                    <span className="text-foreground font-medium">
                      {moduleItem.code}
                    </span>{" "}
                    {moduleItem.title}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
