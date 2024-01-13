import { Fragment } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { DAY_TRUN_MAP, STARS_TIMESLOTS } from "@/config/stars"
import { C_COURSE_DATA, getRelatedModules } from "@/lib/consolidated-data"
import { capitaliseEachWord, formatTitle } from "@/lib/stars.lib"
import ModuleCard from "@/components/module-card"
import ReadMore from "@/components/read-more"

import NotFoundModulePage from "./not-found"

// Change the dynamic behavior of a layout or page to fully static or fully dynamic.
// 'auto' | 'force-dynamic' | 'error' | 'force-static'
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "auto"

// Disable dynamic routes
// @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams
export const dynamicParams = true

export default function Page({
  params
  // searchParams
}: {
  params: { module: string; sem: string }
  searchParams?: { sem: string }
}) {
  const moduleCode = params.module

  // If mod does not exist or is not in the correct format, redirect to 404 page
  if (!moduleCode || !(moduleCode in C_COURSE_DATA)) {
    // Check if mod is in lower case. If so, redirect to the correct page
    // e.g. /mods/ma1000 -> /mods/MA1000
    const lowerCaseMod = Object.keys(C_COURSE_DATA).find(
      (k) => k.toLowerCase() === moduleCode
    )

    if (lowerCaseMod) {
      redirect(`/mods/${lowerCaseMod.toUpperCase()}`)
    }

    return <NotFoundModulePage missingModule={moduleCode} />
  }

  /**
   * Actual Logic
   */

  let data = C_COURSE_DATA[moduleCode] // by default take data from the collated generated file
  const relatedModules = getRelatedModules(moduleCode).slice(0, 12) // limit 12 only
  const NotAvailable = () => <span className="text-secondary">N/A</span>

  return (
    <>
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="w-full space-y-2 xl:w-3/6">
          <span className="text-secondary">{data.code}</span>

          <h1 className="text-3xl capitalize">{formatTitle(data.title)}</h1>

          <ReadMore>
            <div
              className="w-full"
              dangerouslySetInnerHTML={{
                __html: data.description
                  .replaceAll("\n\n", "<br/><br/>")
                  .replaceAll("\n", "<br/>")
              }}
            />
          </ReadMore>
        </div>

        <div className="w-full xl:w-3/6">
          <table className="table w-full border text-sm text-foreground ">
            <tbody>
              <tr>
                <td className="border p-2">AUs</td>
                <td className="border p-2">{data.au} AUs</td>
              </tr>
              <tr>
                <td className="border p-2">Grade Type</td>
                <td className="border p-2">
                  {data.gradeType ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="w-[200px] border p-2">Maintaining Dept</td>
                <td className="border p-2">
                  {data.maintainingDept ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="border p-2">Prerequisites</td>
                <td className="border p-2">
                  {data.prerequisite ? (
                    data.prerequisite.map((preqGrp, preqGrpIdx) => {
                      return (
                        <div key={preqGrpIdx} className="w-full">
                          {/* This section is pretty fucking ugly code, refactor later */}
                          {preqGrp.map((preq, preqIdx) => (
                            <span key={preqIdx}>
                              {preq.length === 6 ? (
                                <Link
                                  href={`/mods/${preq}`}
                                  className="transition-colors hover:text-secondary-foreground">
                                  {preq}
                                </Link>
                              ) : // Test if the first 6 characters are a valid module code
                              /^[A-Z]{2}\d{4}$/.test(preq.slice(0, 6)) ? (
                                <Link
                                  href={`/mods/${preq.slice(0, 6)}`}
                                  className="transition-colors hover:text-secondary-foreground">
                                  {preq.slice(0, 6)} {preq.slice(6)}
                                </Link>
                              ) : (
                                <span key={preqIdx}>{preq}</span>
                              )}

                              {preqIdx < preqGrp.length - 1 && <span>, </span>}
                            </span>
                          ))}

                          {preqGrpIdx <
                            (data.prerequisite || []).length - 1 && (
                            <span> or</span>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <NotAvailable />
                  )}
                </td>
              </tr>

              <tr>
                <td className="border p-2">Mutually Exclusive With</td>
                <td className="border p-2">
                  {data.mutuallyExclusiveWith ? (
                    data.mutuallyExclusiveWith.map((mew, mewIdx) => {
                      return (
                        <Fragment key={mewIdx}>
                          <Link
                            href={`/mods/${mew}`}
                            className="transition-colors hover:text-secondary-foreground">
                            {mew}
                          </Link>

                          <>
                            {mewIdx <
                              (data.mutuallyExclusiveWith || []).length - 1 && (
                              <span>, </span>
                            )}
                          </>
                        </Fragment>
                      )
                    })
                  ) : (
                    <NotAvailable />
                  )}
                </td>
              </tr>

              <tr>
                <td className="border p-2">Not Available To Programme</td>
                <td className="border p-2">
                  {data.notAvailableToProgramme ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="border p-2">
                  Not Available To All Programme With
                </td>
                <td className="border p-2">
                  {data.notAvailableToAllProgrammeWith ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="border p-2">
                  Not available as Core
                  <br />
                  for programmes
                </td>
                <td className="border p-2">
                  {data.notAvailableAsCoreToProgramme ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="border p-2">
                  Not Available as PE
                  <br />
                  for programmes
                </td>
                <td className="border p-2">
                  {data.notAvailableAsPeToProgramme ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="border p-2">
                  Not Available as BDE/UEs
                  <br />
                  for programmes
                </td>
                <td className="border p-2">
                  {data.notAvailableAsBdeueToProgramme ?? <NotAvailable />}
                </td>
              </tr>

              <tr>
                <td className="border p-2">Not Offered To</td>
                <td className="border p-2">
                  {data.notOffered ?? <NotAvailable />}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-2 text-lg">Available Indexes (Coming Soon)</h2>

        <table className="w-full table-fixed border text-[0.6rem] md:text-xs">
          <thead>
            <tr>
              <th className="h-fit w-[40px] p-1 text-center">Time</th>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="p-2">
                  {DAY_TRUN_MAP[i + 1]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {STARS_TIMESLOTS.slice(0, 18).map((slot, idx) => (
              <tr key={slot.start}>
                <td className="relative w-[40px] border p-1 text-center">
                  {idx !== 0 && (
                    <span className="absolute left-0 top-[-8px] w-full bg-background">
                      {slot.start}
                    </span>
                  )}

                  <div className="min-h-[20px] w-full" />
                </td>

                {Array.from({ length: 5 }).map((_, i) => {
                  const randomChance = Math.floor(Math.random() * 100) + 1

                  return (
                    <td
                      key={i}
                      className="w-fit border p-1 text-center md:w-auto">
                      {randomChance <= 5 && "Coming Soon"}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {relatedModules.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-2 text-lg">Other Relevant Mods</h2>

            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
              {relatedModules.map((module) => (
                <ModuleCard key={module.code} module={module} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Generates static parameters for the module page.
 */
export async function generateStaticParams() {
  // All urls are to follow this scheme - `/mods/SC1005`
  return Object.keys(C_COURSE_DATA).map((key) => ({
    module: key
  }))

  // TEMP, not for public
  // return []
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
  const description = `Explore ${data.code} ${title}. Find detailed information, reviews, and schedules for various faculty and subjects. Plan your academic journey with ease.`
  return {
    title: `${data.code} ${title}`,
    description: description.replace(/\s+/g, " ") // triming repeating spaces
  }
}
