import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { TRUN_COURSE_CONTENT } from "@/data/truncated-course-content"

import { capitaliseEachWord } from "@/lib/capitalise-each-word"
import { formatTitle } from "@/lib/format"
import { getModuleData } from "@/lib/get-module-data"
import ModsHeader from "@/components/mods/mods-header"
import ModsIndexTable from "@/components/mods/mods-index-table"
import ModsInfoTable from "@/components/mods/mods-info-table"
import RelatedModules from "@/components/related-modules"

// Change the dynamic behavior of a layout or page to fully static or fully dynamic.
// 'auto' | 'force-dynamic' | 'error' | 'force-static'
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "auto"

// Disable dynamic routes
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams
export const dynamicParams = true

export default function Page({ params }: { params: { module: string } }) {
  const moduleCode = params.module
  const moduleData = getModuleData(moduleCode)

  /**
   * Handles improper page slugs
   */
  if (!moduleData) {
    /**
     * Check if mod is in lower case. If so, redirect to the correct page
     *    e.g. /mods/ma1000 -> /mods/MA1000
     */
    const lowerCaseMod = Object.keys(TRUN_COURSE_CONTENT).find(
      (k) => k.toLowerCase() === moduleCode
    )

    if (lowerCaseMod) {
      redirect(`/mods/${lowerCaseMod.toUpperCase()}`)
    } else {
      notFound()
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="w-full space-y-2 xl:w-3/6">
          <ModsHeader module={moduleData} />
        </div>

        <div className="w-full xl:w-3/6">
          <ModsInfoTable module={moduleData} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-2 text-lg">Available Indexes (Coming Soon)</h2>

        <ModsIndexTable />

        <div className="mt-10">
          <h2 className="mb-2 text-lg">Other Relevant Mods</h2>

          <RelatedModules
            limit={3}
            moduleKey={moduleCode}
            emptyContent={
              <Link
                href="/mods"
                className="text-sm text-secondary transition-colors hover:text-secondary-foreground">
                No Mods Found. Click here to see all Mods
              </Link>
            }
          />
        </div>
      </div>
    </>
  )
}

/**
 * Generates static parameters for the module page.
 */
export async function generateStaticParams() {
  // All urls are to follow this scheme - `/mods/SC1005`
  return Object.keys(TRUN_COURSE_CONTENT).map((key) => ({
    module: key
  }))
}

/**
 * Generates metadata for a module based on the provided parameters.
 * @returns A promise that resolves to the generated metadata or null if the module is not found.
 */
export async function generateMetadata({
  params
}: {
  params: { module: string }
}): Promise<Metadata | null> {
  const moduleKey = params.module
  const mod = Object.keys(TRUN_COURSE_CONTENT).find((k) => k === moduleKey)

  if (!mod) {
    return null
  }
  const moduleTitle = TRUN_COURSE_CONTENT[moduleKey]
  const title = capitaliseEachWord(formatTitle(moduleTitle))
  const description = `Explore ${moduleKey} ${title}. Find detailed information, reviews, and schedules for various faculty and subjects. Plan your academic journey with ease.`
  return {
    title: `${moduleKey} ${title}`,
    description: description.replace(/\s+/g, " ") // triming repeating spaces
  }
}
