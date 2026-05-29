import Link from "next/link"

import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Timetable", href: "/timetable" },
      { label: "Mods", href: "/mods" },
      { label: "Articles", href: "/articles" }
    ]
  },
  {
    title: "Tools",
    links: [
      { label: "Wallpaper Maker", href: "/screenshot" },
      { label: "Settings", href: "/settings" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Changelog", href: "/changelog" },
      { label: "Feedback", href: "/feedback" },
      { label: "FAQ", href: "/faq" }
    ]
  },
  {
    title: "Project",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Sitemap", href: "/sitemap" }
    ]
  }
] as const

const Footer = () => {
  return (
    <footer className="border-border/60 mt-10 space-y-10 border-t px-3 py-10 lg:px-5">
      <div className="container">
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
          Current semester
        </p>

        <Link href="/faq#current-semester" className="hover:underline">
          <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-1 text-sm font-semibold text-blue-500 ring-1 ring-blue-500/20">
            {LATEST_SEMESTER_LABEL}
          </span>
        </Link>
      </div>

      <div className="container grid gap-8 text-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-2">
          <Link
            href="/"
            className="text-foreground inline-flex font-semibold transition-colors hover:text-blue-500">
            {siteConfig.name}
          </Link>

          <p className="text-muted-foreground leading-6">
            Plan NTU timetables, browse modules, compare indexes, and keep
            course planning links close at hand.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h2 className="text-foreground text-sm font-semibold">
              {group.title}
            </h2>

            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-blue-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container">
        <p className="text-muted-foreground text-center text-sm">
          NTUmods.com &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}

export default Footer
