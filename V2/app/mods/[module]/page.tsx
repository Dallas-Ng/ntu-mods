import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { TRUN_M_DATA } from "@/data/2023/trun-m-data"

import { getModule } from "@/lib/get-module"
import ModsHeader from "@/components/mods/mods-header"
import ModsIndexTable from "@/components/mods/mods-index-table"
import ModsInfoTable from "@/components/mods/mods-info-table"
import RelatedModules from "@/components/related-modules"

// Change the dynamic behavior of a layout or page to fully static or fully dynamic.
// 'auto' | 'force-dynamic' | 'error' | 'force-static'
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static"

// Disable dynamic routes
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams
export const dynamicParams = true

// No revalidation
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
export const revalidate = Infinity

export default function Page({ params }: { params: { module: string } }) {
  const moduleKey = params.module
  const moduleData = getModule(moduleKey)

  /**
   * Handles improper page slugs
   */
  if (!moduleData) {
    /**
     * Check if mod is in lower case. If so, redirect to the correct page
     *    e.g. /mods/ma1000 -> /mods/MA1000
     */
    const lowerCaseMod = Object.keys(TRUN_M_DATA).find(
      (k) => k.toLowerCase() === moduleKey
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
        <h2 className="mb-2 text-lg">Available Indexes</h2>

        <ModsIndexTable moduleKey={moduleKey} />

        <div className="mt-10">
          <h2 className="mb-2 text-lg">Other Relevant Mods</h2>
          <RelatedModules
            limit={3}
            moduleKey={moduleKey}
            emptyContent={
              <Link
                href="/mods"
                className="hover:text-hover-primary text-sm text-secondary-foreground transition-colors">
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
  return Object.keys(TRUN_M_DATA).map((key) => ({
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
  const mod = Object.keys(TRUN_M_DATA).find((k) => k === moduleKey)

  if (!mod) {
    return null
  }
  const moduleTitle = TRUN_M_DATA[moduleKey]

  const title = moduleTitle

  const description = `Explore ${moduleKey} ${title}. Find detailed information, reviews, and schedules for various faculty and subjects. Plan your academic journey with ease.`
  return {
    title: `${moduleKey} ${title}`,
    description: description.replace(/\s+/g, " ") // triming repeating spaces
  }
}
