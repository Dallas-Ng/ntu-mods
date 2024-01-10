import { Metadata } from "next"
import { redirect } from "next/navigation"

import { C_COURSE_DATA } from "@/lib/consolidated-data"
import { capitaliseEachWord, formatTitle } from "@/lib/stars.lib"
import LayoutDefault from "@/components/layout-default"

import NotFoundModulePage from "./not-found"

// Change the dynamic behavior of a layout or page to fully static or fully dynamic.
// 'auto' | 'force-dynamic' | 'error' | 'force-static'
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "auto"

// Disable dynamic routes
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams
export const dynamicParams = true

export default function Page({ params }: { params: { module: string } }) {
  const mod = params.module

  if (!mod || !(mod in C_COURSE_DATA)) {
    const lowerCaseMod = Object.keys(C_COURSE_DATA).find(
      (k) => k.toLowerCase() === mod
    )

    if (lowerCaseMod) {
      redirect(`/mods/${lowerCaseMod.toUpperCase()}`)
    }

    return (
      <LayoutDefault>
        <NotFoundModulePage />
      </LayoutDefault>
    )
  }

  const data = C_COURSE_DATA[mod]

  return (
    <LayoutDefault>
      <div className="flex gap-2">
        <div className="w-full space-y-2 md:w-3/6">
          <span className="text-secondary">{data.code}</span>

          <h1 className="text-3xl capitalize">{formatTitle(data.title)}</h1>

          <p>{data.au} au</p>
          <p>{data.description}</p>
        </div>
      </div>
    </LayoutDefault>
  )
}

/**
 * Generates static parameters for the module page.
 */
export async function generateStaticParams() {
  // All urls are to follow this scheme - `/mods/SC1005`
  // return Object.keys(C_COURSE_DATA).map((key) => ({
  //   module: key
  // }))

  // TEMP, not for public
  return []
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
  const mod = Object.keys(C_COURSE_DATA).find((k) => k === moduleKey)

  if (!mod) {
    return null
  }
  const data = C_COURSE_DATA[moduleKey]
  const title = capitaliseEachWord(formatTitle(data.title))

  return {
    title: `${data.code} ${title}`,
    description: `Explore ${data.code} ${title}. Find detailed information, reviews, and schedules for various faculty and subjects. Plan your academic journey with ease.`
  }
}
