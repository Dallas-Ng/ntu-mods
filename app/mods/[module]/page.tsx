import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getAllModuleMetadata } from "@/lib/server/get-module-metadata"
import {
  getModuleCurrentSemester,
  getModuleSemesters
} from "@/lib/server/get-module-current-semester"
import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import ModsHeader from "@/components/mods/mods-header"
import ModsIndexTable from "@/components/mods/mods-index-table"
import ModsInfoTable from "@/components/mods/mods-info-table"
import ModsWorkloadTable from "@/components/mods/mods-workload-table"
import { ModuleContextNav } from "@/components/mods/module-context-nav"
import RelatedModules from "@/components/related-modules"

export const dynamic = "force-static"
export const dynamicParams = true
export const revalidate = Infinity

// Latest semester used for static generation
const LATEST_YEAR = "2025"
const LATEST_SEMESTER = "2"

export default async function Page({ params }: { params: { module: string } }) {
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
  const [allMeta, indexes] = await Promise.all([
    getAllModuleMetadata(year, semester),
    getModuleIndexesData(moduleKey, year, semester)
  ])

  const moduleData = allMeta[moduleKey]
  if (!moduleData) notFound()

  // Fetch all semesters for this module (for "other offerings" nav)
  const allSemesters = await getModuleSemesters(moduleKey)
  const otherSemesters = allSemesters.filter(
    (s) => !(s.year === year && s.semester === semester)
  )

  const semesterLabel = (s: { year: string; semester: string }) => {
    const semName =
      s.semester === "S" ? "Special Term" : `Semester ${s.semester}`
    return `AY${s.year}/${parseInt(s.year) + 1} ${semName}`
  }

  return (
    <>
      <ModuleContextNav code={moduleKey} displayedYear={year} displayedSemester={semester} />

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="w-full xl:w-3/6">
          <ModsHeader module={moduleData} currentYear={year} currentSemester={semester} />
        </div>

        <div className="h-fit w-full space-y-2 xl:w-3/6">
          <ModsInfoTable module={moduleData} />

          <hr />

          <ModsWorkloadTable indexes={indexes} />
        </div>
      </div>

      {otherSemesters.length > 0 && (
        <div className="mt-6 space-y-1">
          <p className="text-sm text-muted-foreground">Other offerings</p>
          <div className="flex flex-wrap gap-2">
            {otherSemesters.map((s) => (
              <Link
                key={`${s.year}-${s.semester}`}
                href={getModuleVersionUrl(moduleKey, s.year, s.semester)}
                className="rounded-md border px-3 py-1 text-sm transition-colors hover:bg-accent">
                {semesterLabel(s)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 space-y-2">
        <h2 className="text-lg">Available Indexes</h2>

        <ModsIndexTable indexes={indexes} />

        <div className="mt-10">
          <h2 className="mb-2 text-lg">Other Relevant Mods</h2>
          <RelatedModules
            limit={9}
            moduleKey={moduleKey}
            currentYear={year}
            currentSemester={semester}
            emptyContent={
              <Link
                href="/mods"
                className="text-sm text-muted-foreground transition-colors hover:text-primary-alt">
                No Mods Found. Click here to see all Mods
              </Link>
            }
          />
        </div>
      </div>
    </>
  )
}

export async function generateStaticParams() {
  const allMeta = await getAllModuleMetadata(LATEST_YEAR, LATEST_SEMESTER)
  return Object.keys(allMeta).map((key) => ({ module: key }))
}

export async function generateMetadata({
  params
}: {
  params: { module: string }
}): Promise<Metadata | null> {
  const moduleKey = params.module.toUpperCase()
  const current = await getModuleCurrentSemester(moduleKey)
  if (!current) return null

  const allMeta = await getAllModuleMetadata(current.year, current.semester)
  const mod = allMeta[moduleKey]
  if (!mod) return null

  return {
    title: `${moduleKey} ${mod.title}`,
    description: `Explore ${moduleKey} ${mod.title}. Find detailed information and schedules. Plan your academic journey with ease.`,
    alternates: { canonical: getModuleUrl(moduleKey) }
  }
}
