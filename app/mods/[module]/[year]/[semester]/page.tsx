import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getModuleMetadata } from "@/lib/server/get-module-metadata"
import { getModuleCurrentSemester } from "@/lib/server/get-module-current-semester"
import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"
import { getModuleExamData } from "@/lib/server/get-module-exam-data"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import { getModuleCategories } from "@/lib/get-module-category"
import { MODULE_CATEGORY } from "@/lib/constants"
import { formatTitle } from "@/lib/format"
import ModsIndexTable from "@/components/mods/mods-index-table"
import Breadcrumbs from "@/components/breadcrumbs"

export const revalidate = Infinity

interface Params {
  module: string
  year: string
  semester: string
}

export default async function Page({ params }: { params: Params }) {
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
            {" "}·{" "}
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
              { name: semLabel, label: semLabel, href: getModuleVersionUrl(code, year, semester) }
            ]}
          />
          <h1 className="mt-2 text-3xl">{formatTitle(moduleData.title)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{semLabel}</p>
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

              {moduleData.notAvailableToProgramme && (
                <tr>
                  <td className="p-2">Not Available To Programme</td>
                  <td className="p-2">{moduleData.notAvailableToProgramme}</td>
                </tr>
              )}

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

export async function generateMetadata({
  params
}: {
  params: Params
}): Promise<Metadata | null> {
  const code = params.module.toUpperCase()
  const { year, semester } = params

  const moduleData = await getModuleMetadata(code, year, semester)
  if (!moduleData) return null

  const semName = semester === "S" ? "Special Term" : `Semester ${semester}`

  return {
    title: `${code} ${moduleData.title} — AY${year} ${semName}`,
    description: `Historical snapshot of ${code} ${moduleData.title} for AY${year}/${parseInt(year) + 1} ${semName}.`,
    alternates: { canonical: getModuleVersionUrl(code, year, semester) }
  }
}
