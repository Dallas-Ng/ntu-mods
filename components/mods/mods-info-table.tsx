import { Fragment } from "react"
import Link from "next/link"
import { C_EXAMS } from "@/data/2023-exams"

import { cn } from "@/lib/utils"

interface Props {
  module: CourseData
}

const NotAvailable = () => <span className="text-secondary">N/A</span>

const testPossibleModuleCode = (str: string) =>
  str.length > 6 ? /^[A-Z]{2}\d{4}$/.test(str.slice(0, 6)) : false

export default function ModsInfoTable({ module }: Props) {
  const exam = module.code in C_EXAMS ? C_EXAMS[module.code] : undefined

  return (
    <table className="table w-full border text-sm text-foreground">
      <tbody>
        <tr>
          <td className="border p-2">AUs</td>
          <td className="border p-2">{module.au} AUs</td>
        </tr>

        <tr>
          <td
            className={cn("border p-2", exam && "font-semibold text-rose-800")}>
            Exam
          </td>
          <td className="border p-2">
            {exam ? (
              <span className="font-semibold text-rose-800">
                {exam.date}, {exam.start_time} - {exam.end_time}
              </span>
            ) : (
              <NotAvailable />
            )}
          </td>
        </tr>

        <tr>
          <td className="border p-2">Grade Type</td>
          <td className="border p-2">{module.gradeType ?? <NotAvailable />}</td>
        </tr>

        <tr>
          <td className="w-[200px] border p-2">Maintaining Dept</td>
          <td className="border p-2">
            {module.maintainingDept ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">Prerequisites</td>
          <td className="border p-2">
            {module.prerequisite &&
              module.prerequisite.map((preqGrp, preqGrpIdx) => (
                // Preq group
                <div key={preqGrpIdx} className="w-full">
                  {preqGrp.map((preq, preqIdx) => (
                    // Individual preq
                    <span key={preqIdx}>
                      {preq.length === 6 ? (
                        <Link
                          href={`/mods/${preq}`}
                          className="transition-colors hover:text-secondary-foreground">
                          {preq}
                        </Link>
                      ) : // Test if the first 6 characters are a valid module code
                      testPossibleModuleCode(preq) ? (
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

                  {preqGrpIdx < (module.prerequisite || []).length - 1 && (
                    <span> or</span>
                  )}
                </div>
              ))}

            {!module.prerequisite && <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">Mutually Exclusive With</td>
          <td className="border p-2">
            {module.mutuallyExclusiveWith &&
              module.mutuallyExclusiveWith.map((mew, mewIdx) => {
                return (
                  <Fragment key={mewIdx}>
                    <Link
                      href={`/mods/${mew}`}
                      className="transition-colors hover:text-secondary-foreground">
                      {mew}
                    </Link>

                    <>
                      {mewIdx <
                        (module.mutuallyExclusiveWith || []).length - 1 && (
                        <span>, </span>
                      )}
                    </>
                  </Fragment>
                )
              })}

            {!module.mutuallyExclusiveWith && <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">Not Available To Programme</td>
          <td className="border p-2">
            {module.notAvailableToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">Not Available To All Programme With</td>
          <td className="border p-2">
            {module.notAvailableToAllProgrammeWith ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">
            Not available as Core
            <br />
            for programmes
          </td>
          <td className="border p-2">
            {module.notAvailableAsCoreToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">
            Not Available as PE
            <br />
            for programmes
          </td>
          <td className="border p-2">
            {module.notAvailableAsPeToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">
            Not Available as BDE/UEs
            <br />
            for programmes
          </td>
          <td className="border p-2">
            {module.notAvailableAsBdeueToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="border p-2">Not Offered To</td>
          <td className="border p-2">
            {module.notOffered ?? <NotAvailable />}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
