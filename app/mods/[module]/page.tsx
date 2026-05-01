import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import { getLatestSemester } from "@/lib/server/get-latest-semester"
import {
  getModuleCurrentSemester,
  getModuleSemesters
} from "@/lib/server/get-module-current-semester"
import { getModuleExamData } from "@/lib/server/get-module-exam-data"
import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"
import { getAllModuleMetadata } from "@/lib/server/get-module-metadata"
import ModsHeader from "@/components/mods/mods-header"
import ModsIndexTable from "@/components/mods/mods-index-table"
import ModsInfoTable from "@/components/mods/mods-info-table"
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
  const [allMeta, indexes, exam] = await Promise.all([
    getAllModuleMetadata(year, semester),
    getModuleIndexesData(moduleKey, year, semester),
    getModuleExamData(moduleKey, year, semester)
  ])

  const moduleData = allMeta[moduleKey]
  if (!moduleData) notFound()

  // Determine whether this module is offered in the current (latest) semester
  const latest = await getLatestSemester()
  const isCurrentOffering =
    current.year === latest.year && current.semester === latest.semester

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
        <h2 className="text-lg">Available Indexes</h2>

        <ModsIndexTable indexes={indexes} />

        {otherSemesters.length > 0 && (
          <div>
            <h2 className="mb-2 text-lg">Other offerings</h2>

            <div className="flex flex-wrap gap-2">
              {otherSemesters.map((s) => (
                <Link
                  key={`${s.year}-${s.semester}`}
                  href={getModuleVersionUrl(moduleKey, s.year, s.semester)}
                  className="hover:bg-accent rounded-md border px-3 py-1 text-sm transition-colors">
                  {semesterLabel(s)}
                </Link>
              ))}
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
    </>
  )
}

export async function generateStaticParams() {
  const latest = await getLatestSemester()
  const allMeta = await getAllModuleMetadata(latest.year, latest.semester)
  return Object.keys(allMeta).map((key) => ({ module: key }))
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

  return {
    title: `${moduleKey} ${mod.title}`,
    description: `Explore ${moduleKey} ${mod.title}. Find detailed information and schedules. Plan your academic journey with ease.`,
    alternates: { canonical: getModuleUrl(moduleKey) }
  }
}
