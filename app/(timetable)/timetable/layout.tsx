import { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import {
  LATEST_SEMESTER_LABEL,
  LATEST_SEMESTER_LABEL_SHORT
} from "@/lib/semesters"
import LayoutDefault from "@/components/layout-default"

interface Props {
  children?: React.ReactNode
}

export const metadata: Metadata = {
  title: siteConfig.metatags.timetable.title,
  description: siteConfig.metatags.timetable.desc,
  alternates: { canonical: "/timetable" }
}

const Layout = ({ children }: Props) => {
  return (
    <LayoutDefault>
      {children}

      <div className="mt-8 space-y-3 rounded-lg border p-4 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">
            NTU class schedule for {LATEST_SEMESTER_LABEL}:
          </strong>{" "}
          4,846 class indexes across 1,134 modules. Each index is a specific
          class group with fixed timeslots, venues, and a class number used
          during STARS registration. Index types include lectures, tutorials,
          labs, seminars, and recitations — most modules require registration
          for more than one index type. The timetable planner above lets you
          search modules, compare index timeslots, detect clashes, and build a
          schedule before NTU STARS registration opens.
        </p>
        <div className="space-y-1.5">
          <p className="font-medium">Related guides</p>
          <div className="flex flex-col gap-1">
            <Link
              href="/articles/ntu-stars-guide"
              className="text-blue-500 hover:underline">
              NTU STARS: How the Module Registration System Works →
            </Link>
            <Link
              href="/articles/how-to-plan-for-modules"
              className="text-blue-500 hover:underline">
              How to Plan NTU Modules Before STARS Opens →
            </Link>
            <Link
              href="/articles/ntu-timetable-planner-guide"
              className="text-blue-500 hover:underline">
              NTU Timetable Planner Guide →
            </Link>
            <Link
              href="/articles/ntu-academic-calendar-ay2026"
              className="text-blue-500 hover:underline">
              NTU Academic Calendar AY2026/2027 — Key Dates →
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Module and index data sourced from NTU&apos;s official timetable.
          Updated each semester. Current:{" "}
          <span className="font-medium">{LATEST_SEMESTER_LABEL_SHORT}</span>.
        </p>
      </div>
    </LayoutDefault>
  )
}

export default Layout
