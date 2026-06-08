import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { siteConfig } from "@/config/site"
import { generateTimetableMatrix } from "@/lib/generate-timetable-matrix"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import { getLatestSemester } from "@/lib/server/get-latest-semester"
import {
  getModuleCurrentSemester,
  getModuleSemesters
} from "@/lib/server/get-module-current-semester"
import { getModuleExamData } from "@/lib/server/get-module-exam-data"
import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"
import { getAllModuleMetadata } from "@/lib/server/get-module-metadata"
import {
  getModulePrerequisites,
  getPrerequisiteGraph
} from "@/lib/server/get-prerequisite-graph"
import ModsHeader from "@/components/mods/mods-header"
import ModsIndexTable from "@/components/mods/mods-index-table"
import ModsInfoTable from "@/components/mods/mods-info-table"
import ModsPrerequisiteGraph from "@/components/mods/mods-prerequisite-graph"
import ModsViewTracker from "@/components/mods/mods-view-tracker"
import ModsWorkloadTable from "@/components/mods/mods-workload-table"
import RelatedModules from "@/components/related-modules"

export const dynamic = "force-static"
export const dynamicParams = true
export const revalidate = false

export default async function Page(props: {
  params: Promise<{ module: string }>
}) {
  const params = await props.params
  const rawKey = params.module

  // Normalise to uppercase
  if (rawKey !== rawKey.toUpperCase()) {
    redirect(getModuleUrl(rawKey.toUpperCase()))
  }

  const moduleKey = rawKey.toUpperCase()

  // Find module's current semester
  const current = await getModuleCurrentSemester(moduleKey)
  if (!current) notFound()

  const { year, semester } = current

  // Fetch module metadata and indexes
  const [allMeta, indexes, exam, prereqGraph, prereqNode] = await Promise.all([
    getAllModuleMetadata(year, semester),
    getModuleIndexesData(moduleKey, year, semester),
    getModuleExamData(moduleKey, year, semester),
    getPrerequisiteGraph(),
    getModulePrerequisites(moduleKey)
  ])

  const moduleData = allMeta[moduleKey]
  if (!moduleData) notFound()

  const { TABLE_MATRIX, TABLE_MAX_DAY_COLUMNS } = generateTimetableMatrix(
    Object.fromEntries(
      Object.entries(indexes).map(([k, v]) => [k, [...v]])
    ) as Record<string, Index[]>,
    9
  )

  // Determine whether this module is offered in the current (latest) semester
  const latest = await getLatestSemester()
  const isCurrentOffering =
    current.year === latest.year && current.semester === latest.semester

  // Fetch all semesters for this module (for "other offerings" nav)
  const allSemesters = await getModuleSemesters(moduleKey)
  const otherSemesters = allSemesters.filter(
    (s) => !(s.year === year && s.semester === semester)
  )

  const offeringsByYear = otherSemesters.reduce<
    Record<string, Array<{ year: string; semester: string }>>
  >((acc, s) => {
    ;(acc[s.year] ??= []).push(s)
    return acc
  }, {})
  const sortedYears = Object.keys(offeringsByYear).sort((a, b) =>
    b.localeCompare(a)
  )

  const semesterLabel = (s: { year: string; semester: string }) => {
    const semName =
      s.semester === "S" ? "Special Term" : `Semester ${s.semester}`
    return `AY${s.year}/${parseInt(s.year) + 1} ${semName}`
  }

  return (
    <>
      <ModsViewTracker
        moduleCode={moduleKey}
        isCurrentOffering={isCurrentOffering}
      />
      {!isCurrentOffering && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Not offered in the current semester · Last offered{" "}
          {semesterLabel(current)}
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="w-full xl:w-3/6">
          <ModsHeader
            module={moduleData}
            currentYear={year}
            currentSemester={semester}
            isCurrentOffering={isCurrentOffering}
          />

          {moduleData.description && (
            <p className="mt-4 leading-relaxed">{moduleData.description}</p>
          )}
        </div>

        <div className="h-fit w-full space-y-2 xl:w-3/6">
          <ModsInfoTable module={moduleData} exam={exam} />

          <hr />

          <ModsWorkloadTable indexes={indexes} />
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {prereqNode && (
          <ModsPrerequisiteGraph
            moduleCode={moduleKey}
            node={prereqNode}
            graph={prereqGraph}
          />
        )}

        <h2 className="text-lg">Available Indexes</h2>

        <ModsIndexTable
          indexes={indexes}
          precomputedMatrix={{ TABLE_MATRIX, TABLE_MAX_DAY_COLUMNS }}
        />

        {otherSemesters.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg">Other offerings</h2>
            <div className="flex gap-1 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-x-visible xl:pb-0">
              {sortedYears.map((yr) => {
                const sems = offeringsByYear[yr]
                const find = (sem: string) =>
                  sems.find((s) => s.semester === sem)
                return (
                  <div
                    key={yr}
                    className="bg-muted/40 flex min-w-27.5 flex-col overflow-hidden rounded-lg">
                    <span className="text-muted-foreground border-border/50 border-b px-3 py-2 text-xs font-medium">
                      AY{yr.slice(2)}/{String(parseInt(yr) + 1).slice(2)}
                    </span>
                    <div className="flex flex-col gap-1 p-2">
                      {(["1", "2", "S"] as const).map((sem) => {
                        const s = find(sem)
                        const label =
                          sem === "S" ? "Sp. Term" : `Semester ${sem}`
                        return s ? (
                          <Link
                            key={sem}
                            href={getModuleVersionUrl(
                              moduleKey,
                              s.year,
                              s.semester
                            )}
                            className="hover:bg-background border-border/60 rounded-md border px-2 py-1 text-center text-sm transition-colors">
                            {label}
                          </Link>
                        ) : (
                          <span
                            key={sem}
                            className="text-muted-foreground/35 px-2 py-1 text-center text-sm line-through">
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-lg">Other Relevant Mods</h2>
          <RelatedModules
            limit={9}
            moduleKey={moduleKey}
            currentYear={year}
            currentSemester={semester}
            emptyContent={
              <Link
                href="/mods"
                className="text-muted-foreground hover:text-primary-alt text-sm transition-colors">
                No Mods Found. Click here to see all Mods
              </Link>
            }
          />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Course",
              name: `${moduleKey} ${moduleData.title}`,
              courseCode: moduleKey,
              description: moduleData.description || moduleData.title,
              numberOfCredits: String(moduleData.au),
              provider: {
                "@type": "CollegeOrUniversity",
                name: "Nanyang Technological University",
                sameAs: "https://www.ntu.edu.sg"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Mods",
                  item: `${siteConfig.url}/mods`
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: `${moduleKey} ${moduleData.title}`,
                  item: `${siteConfig.url}/mods/${moduleKey}`
                }
              ]
            }
          ])
        }}
      />
    </>
  )
}

export async function generateStaticParams() {
  if (process.env.VERCEL_ENV !== "production") return []
  // Use module-map to cover all 4,228 historical module codes, not just the current semester.
  // Prevents ISR fallback writes for historical modules.
  const fs = await import("fs/promises")
  const path = await import("path")
  const raw = await fs.readFile(
    path.join(process.cwd(), "src/data/api/module-map.json"),
    "utf-8"
  )
  const moduleMap = JSON.parse(raw) as Record<string, unknown>
  return Object.keys(moduleMap).map((key) => ({ module: key }))
}

export async function generateMetadata(props: {
  params: Promise<{ module: string }>
}): Promise<Metadata | null> {
  const params = await props.params
  const moduleKey = params.module.toUpperCase()
  const current = await getModuleCurrentSemester(moduleKey)
  if (!current) return null

  const allMeta = await getAllModuleMetadata(current.year, current.semester)
  const mod = allMeta[moduleKey]
  if (!mod) return null

  const baseDesc = mod.description?.trim()
    ? `${mod.description.trim().slice(0, 100)}${mod.description.trim().length > 100 ? "…" : ""}`
    : `${moduleKey} is a ${mod.au} AU NTU module. Check index schedules, class times, exam dates, venues, and prerequisites on NTUMods.`

  return {
    title: `${moduleKey} ${mod.title} (${mod.au} AU) | NTUMods`,
    description: baseDesc,
    keywords: [moduleKey, mod.title, "NTU", `${moduleKey} NTU`],
    alternates: { canonical: getModuleUrl(moduleKey) }
  }
}
