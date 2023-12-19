"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound-state"
import { Plus, X } from "lucide-react"

import { C_DATA } from "@/lib/consolidated-data"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

import StarsCourseSelect from "../stars-course-select"
import StarsIndexSelect from "../stars-index-select"
import { Button } from "../ui/button"

const CourseTypeBadge = ({
  type,
  active
}: {
  type: string
  active: boolean
}) => {
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1 text-xs text-white",
        active && "bg-zinc-800"
      )}>
      {type}
    </div>
  )
}

export default function StarsManageButton() {
  const { coursesToIndex, removeCourseToIndex, removeCourse } = useBoundState()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="fixed bottom-[50px] right-[50px] z-10 rounded-full border border-gray-200 bg-white p-2 shadow-lg transition-colors duration-100 hover:cursor-pointer hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        onClick={() => setOpen(true)}>
        <Plus className="h-7 w-7" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-30 flex w-[97%] max-w-4xl flex-col justify-start px-2 py-5 md:px-5">
          <DialogHeader className="h-fit">
            <DialogTitle>Courses</DialogTitle>
            <DialogDescription>Add your courses</DialogDescription>
          </DialogHeader>

          <div className="flex h-full w-full flex-col items-start">
            <div className="w-full pb-3 md:w-[300px]">
              <StarsCourseSelect popoverClassName="w-[calc(100vw-2.3rem)] md:w-[300px]" />
            </div>

            <div className="h-[50vh] w-full gap-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 h-[25px] bg-slate-950">
                  <tr className="text-xs">
                    <th className="w-[70px]">Code</th>

                    <th className="hidden md:block">Name</th>

                    <th>Type</th>

                    <th>Index</th>

                    <th className="w-[40px]"></th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(coursesToIndex).map(
                    ([courseKey, courseVal]) => {
                      const course = C_DATA[courseKey as keyof typeof C_DATA]

                      return (
                        <tr className="h-[50px]">
                          <td className="w-[75px] text-center text-sm">
                            {course.key}
                          </td>

                          <td className="hidden md:table-cell">
                            <p className="line-clamp-1 text-sm capitalize">
                              {course.title
                                .toLowerCase()
                                .trim()
                                .replaceAll("~", "")}
                            </p>
                          </td>

                          <td>
                            <div className="flex items-center justify-center gap-1">
                              <CourseTypeBadge
                                type="TUT"
                                active={Object.values(courseVal).some((v) =>
                                  v.type.includes("TUT")
                                )}
                              />

                              <CourseTypeBadge
                                type="LEC"
                                active={Object.values(courseVal).some((v) =>
                                  v.type.includes("LEC")
                                )}
                              />

                              <CourseTypeBadge
                                type="SEM"
                                active={Object.values(courseVal).some((v) =>
                                  v.type.includes("SEM")
                                )}
                              />

                              <CourseTypeBadge
                                type="LAB"
                                active={Object.values(courseVal).some((v) =>
                                  v.type.includes("LAB")
                                )}
                              />
                            </div>
                          </td>

                          <td>
                            <div className="flex w-full items-center justify-center">
                              <StarsIndexSelect courseKey={courseKey} />
                            </div>
                          </td>

                          <td>
                            <div className="flex w-full items-center justify-center">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  removeCourse(courseKey)
                                  removeCourseToIndex(courseKey)
                                }}
                                className={cn(
                                  "h-[40px] w-[40px] p-0 text-white transition-colors duration-100 hover:cursor-pointer hover:bg-rose-500"
                                )}>
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </>
  )
}
