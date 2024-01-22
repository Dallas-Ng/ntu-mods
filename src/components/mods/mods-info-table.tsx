import { Fragment } from "react"
import Link from "next/link"
import { M_EXAMS } from "@/data/2023/exam"
import { TRUN_M_DATA } from "@/data/2023/trun-m-data"

import { cn } from "@/lib/utils"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip"

interface Props {
  module: Module
}

const NotAvailable = () => <span className="text-muted-foreground">N/A</span>

const validateModuleCode = (moduleKey: string) => {
  return moduleKey in TRUN_M_DATA
}

const ModsInfoTable = ({ module }: Props) => {
  const exam = module.code in M_EXAMS ? M_EXAMS[module.code] : undefined

  return (
    <table className="bg-background text-sm">
      <tbody>
        <tr>
          <td className="p-2">AUs</td>
          <td className="p-2">{module.au} AUs</td>
        </tr>

        <tr>
          <td
            className={cn("border p-2", exam && "font-semibold text-rose-800")}>
            Exam
          </td>
          <td className="p-2">
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
          <td className="p-2">Grade Type</td>
          <td className="p-2">{module.gradeType ?? <NotAvailable />}</td>
        </tr>

        <tr>
          <td className="w-[200px] border p-2">Maintaining Dept</td>
          <td className="p-2">{module.maintainingDept ?? <NotAvailable />}</td>
        </tr>

        <tr>
          <td className="p-2">Prerequisites</td>
          <td className="p-2">
            {module.prerequisite &&
              module.prerequisite.map((preqGrp, preqGrpIdx) => (
                // Preq group
                <div key={preqGrpIdx} className="w-full">
                  {preqGrp.map((preq, preqIdx) => {
                    const preqModuleCode = preq.slice(0, 6)
                    const validPreqModuleCode =
                      validateModuleCode(preqModuleCode)

                    return (
                      // Individual preq
                      <span key={preqIdx}>
                        {validPreqModuleCode ? (
                          <Link
                            href={`/mods/${preq.slice(0, 6)}`}
                            className="text-blue-500 transition-colors hover:text-blue-600">
                            {preq.slice(0, 6)} {preq.slice(6)}
                          </Link>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span>
                                  {preq.slice(0, 6)} {preq.slice(6)}
                                </span>
                              </TooltipTrigger>

                              <TooltipContent>
                                This module is not available
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {preqIdx < preqGrp.length - 1 && <span>, </span>}
                      </span>
                    )
                  })}

                  {preqGrpIdx < (module.prerequisite || []).length - 1 && (
                    <span> or</span>
                  )}
                </div>
              ))}

            {!module.prerequisite && <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">Mutually Exclusive With</td>
          <td className="p-2">
            {module.mutuallyExclusiveWith &&
              module.mutuallyExclusiveWith.map((mew, mewIdx) => {
                const validModuleCode = validateModuleCode(mew)

                return (
                  <Fragment key={mewIdx}>
                    {validModuleCode ? (
                      <Link
                        href={`/mods/${mew}`}
                        className="text-blue-500  transition-colors hover:text-blue-600">
                        {mew}
                      </Link>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span>
                              <span>{mew}</span>
                            </span>
                          </TooltipTrigger>

                          <TooltipContent>
                            This module is not available
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

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
          <td className="p-2">Not Available To Programme</td>
          <td className="p-2">
            {module.notAvailableToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">Not Available To All Programme With</td>
          <td className="p-2">
            {module.notAvailableToAllProgrammeWith ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">
            Not available as Core
            <br />
            for programmes
          </td>
          <td className="p-2">
            {module.notAvailableAsCoreToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">
            Not Available as PE
            <br />
            for programmes
          </td>
          <td className="p-2">
            {module.notAvailableAsPeToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">
            Not Available as BDE/UEs
            <br />
            for programmes
          </td>
          <td className="p-2">
            {module.notAvailableAsBdeueToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">Not Offered To</td>
          <td className="p-2">{module.notOffered ?? <NotAvailable />}</td>
        </tr>
      </tbody>
    </table>
  )
}

export default ModsInfoTable
