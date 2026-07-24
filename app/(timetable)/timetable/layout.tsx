import { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import LayoutDefault from "@/components/layout-default"

interface Props {
  children?: React.ReactNode
}

export const metadata: Metadata = {
  title: siteConfig.metatags.timetable.title,
  description: siteConfig.metatags.timetable.desc,
  alternates: { canonical: "/timetable" }
}

const GUIDES = [
  {
    href: "/articles/how-to-plan-for-modules",
    title: "How to Plan NTU Modules Before STARS Opens",
    description:
      "Step-by-step workflow for building your semester plan — from mapping AU requirements to locking in lab indexes before bidding opens."
  },
  {
    href: "/articles/ntu-stars-guide",
    title: "NTU STARS: How the Registration System Works",
    description:
      "What happens in each STARS round, how to prepare your shortlist, and what to do when your first choice fills up."
  },
  {
    href: "/articles/ntu-academic-calendar-ay2026",
    title: "NTU Academic Calendar AY2026/2027",
    description:
      "Key dates for Semester 1 and 2 — semester start and end, recess week, exam period, and STARS round timing."
  },
  {
    href: "/articles/ntu-timetable-planner-guide",
    title: "NTU Timetable Planner Guide",
    description:
      "How to use NTUMods to search modules, compare indexes, detect clashes, and export your schedule to calendar."
  }
]

const Layout = ({ children }: Props) => {
  return (
    <LayoutDefault>
      {children}

      <section className="mt-10 space-y-4 border-t pt-8">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Planning guides
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {LATEST_SEMESTER_LABEL} · 1,134 modules · 4,846 class indexes
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDES.map(({ href, title, description }) => (
            <Link
              key={href}
              href={href}
              className="bg-card hover:bg-accent group rounded-lg border p-4 transition-colors">
              <p className="group-hover:text-primary text-sm leading-snug font-medium">
                {title}
              </p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </LayoutDefault>
  )
}

export default Layout
