import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { MODULE_CATEGORY } from "@/lib/constants"
import { formatTitle } from "@/lib/format"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import { getModuleCurrentSemester } from "@/lib/server/get-module-current-semester"
import { getModuleExamData } from "@/lib/server/get-module-exam-data"
import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"
import { getModuleMetadata } from "@/lib/server/get-module-metadata"
import Breadcrumbs from "@/components/breadcrumbs"
import ModsIndexTable from "@/components/mods/mods-index-table"

export const dynamic = "force-static"
export const dynamicParams = true
export const revalidate = false

// AY starts in August. Before Aug → current AY started last calendar year.
const now = new Date()
const currentAYStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
const STATIC_YEAR_CUTOFF = currentAYStart - 1 // pre-build current AY + 1 prior

export async function generateStaticParams() {
  const fs = await import("fs/promises")
  const path = await import("path")
  const metadataDir = path.join(process.cwd(), "src/data/api/metadata")
  const files = (await fs.readdir(metadataDir)).filter((f: string) =>
    f.endsWith(".json")
  )
  const params: { module: string; year: string; semester: string }[] = []
  for (const file of files) {
    const stem = file.replace(".json", "")
    const idx = stem.indexOf("_")
    const year = stem.slice(0, idx)
    const semester = stem.slice(idx + 1)
    if (parseInt(year) < STATIC_YEAR_CUTOFF) continue
    const data = JSON.parse(
      await fs.readFile(path.join(metadataDir, file), "utf-8")
    ) as Record<string, unknown>
    for (const module of Object.keys(data)) {
      params.push({ module, year, semester })
    }
  }
  return params
}

interface Params {
  module: string
  year: string
  semester: string
}

export default async function Page(props: { params: Promise<Params> }) {
  const params = await props.params
  const rawCode = params.module
  const { year, semester } = params

  // Normalise code to uppercase
  if (rawCode !== rawCode.toUpperCase()) {
    redirect(getModuleVersionUrl(rawCode.toUpperCase(), year, semester))
  }

  const code = rawCode.toUpperCase()

  // Validate: does this semester's metadata file exist and contain the module?
  const moduleData = await getModuleMetadata(code, year, semester)
  if (!moduleData) notFound()

  // Determine the module's current semester
  const current = await getModuleCurrentSemester(code)

  // If this versioned URL IS the current semester → redirect to base URL
  if (current && current.year === year && current.semester === semester) {
    redirect(getModuleUrl(code))
  }

  const [indexes, exam] = await Promise.all([
    getModuleIndexesData(code, year, semester),
    getModuleExamData(code, year, semester)
  ])
  const categories = getModuleCategories(moduleData.searchKeys)

  const semName = semester === "S" ? "Special Term" : `Semester ${semester}`
  const semLabel = `AY${year}/${parseInt(year) + 1} ${semName}`

  return (
    <>
      {/* Historical snapshot banner */}
      <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
        Historical snapshot — {semLabel}
        {current && (
          <>
            {" "}
            ·{" "}
            <Link
              href={getModuleUrl(code)}
              className="underline transition-colors hover:text-amber-600 dark:hover:text-amber-200">
              View current offering →
            </Link>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-6 xl:flex-row">
        <div className="w-full xl:w-3/6">
          <Breadcrumbs
            breadcrumbs={[
              { name: "Mods", label: "Mods", href: "/mods" },
              {
                name: code,
                label: code,
                href: getModuleUrl(code)
              },
              {
                name: semLabel,
                label: semLabel,
                href: getModuleVersionUrl(code, year, semester)
              }
            ]}
          />
          <h1 className="mt-2 text-3xl">{formatTitle(moduleData.title)}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{semLabel}</p>
          {moduleData.description && (
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {moduleData.description}
            </p>
          )}
        </div>

        <div className="h-fit w-full xl:w-3/6">
          <table className="bg-background text-sm">
            <tbody>
              <tr>
                <td className="p-2">AUs</td>
                <td className="p-2">{moduleData.au} AUs</td>
              </tr>

              {categories.length > 0 && (
                <tr>
                  <td className="p-2">Categories</td>
                  <td className="flex flex-wrap gap-1 p-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full border px-2 py-0 text-xs">
                        {MODULE_CATEGORY[cat]}
                      </span>
                    ))}
                  </td>
                </tr>
              )}

              {moduleData.gradeType && (
                <tr>
                  <td className="p-2">Grade Type</td>
                  <td className="p-2">{moduleData.gradeType}</td>
                </tr>
              )}

              {moduleData.notAvailableToProgramme && (
                <tr>
                  <td className="p-2">Not Available To Programme</td>
                  <td className="p-2">{moduleData.notAvailableToProgramme}</td>
                </tr>
              )}

              {moduleData.notAvailableToAllProgrammeWith && (
                <tr>
                  <td className="p-2">Not Available To All Programme With</td>
                  <td className="p-2">
                    {moduleData.notAvailableToAllProgrammeWith}
                  </td>
                </tr>
              )}

              {moduleData.notAvailableAsBdeueToProgramme && (
                <tr>
                  <td className="p-2">Not Available As BDE/UE To Programme</td>
                  <td className="p-2">
                    {moduleData.notAvailableAsBdeueToProgramme}
                  </td>
                </tr>
              )}

              {moduleData.notAvailableAsCoreToProgramme && (
                <tr>
                  <td className="p-2">Not Available As Core To Programme</td>
                  <td className="p-2">
                    {moduleData.notAvailableAsCoreToProgramme}
                  </td>
                </tr>
              )}

              {moduleData.notAvailableAsPeToProgramme && (
                <tr>
                  <td className="p-2">Not Available As PE To Programme</td>
                  <td className="p-2">
                    {moduleData.notAvailableAsPeToProgramme}
                  </td>
                </tr>
              )}

              {moduleData.mutuallyExclusiveWith && (
                <tr>
                  <td className="p-2">Mutually Exclusive With</td>
                  <td className="p-2">
                    {moduleData.mutuallyExclusiveWith.join(", ")}
                  </td>
                </tr>
              )}

              {moduleData.extras &&
                Object.entries(moduleData.extras).map(([label, value]) => (
                  <tr key={label}>
                    <td className="p-2">{label}</td>
                    <td className="p-2">{value}</td>
                  </tr>
                ))}

              <tr>
                <td className="p-2">Exam</td>
                <td className="p-2">
                  {exam
                    ? `${exam.date}, ${exam.start_time} - ${exam.end_time}`
                    : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 space-y-2">
        <h2 className="text-lg">Available Indexes</h2>
        <ModsIndexTable indexes={indexes} />
      </div>
    </>
  )
}

export async function generateMetadata(props: {
  params: Promise<Params>
}): Promise<Metadata | null> {
  const params = await props.params
  const code = params.module.toUpperCase()
  const { year, semester } = params

  const moduleData = await getModuleMetadata(code, year, semester)
  if (!moduleData) return null

  const semName = semester === "S" ? "Special Term" : `Semester ${semester}`

  return {
    title: `${code} ${moduleData.title} | AY${year} ${semName}`,
    description: `View the AY${year}/${parseInt(year) + 1} ${semName} record for ${code} ${moduleData.title}, including module details, index schedules, class times, venues, and exams.`,
    alternates: { canonical: getModuleVersionUrl(code, year, semester) }
  }
}
