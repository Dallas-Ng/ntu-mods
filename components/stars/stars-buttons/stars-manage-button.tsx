"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useBoundState } from "@/state/bound-state"
import { Plus, X } from "lucide-react"

import { C_DATA } from "@/lib/consolidated-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

import StarsCourseSelect from "../stars-course-select"
import StarsIndexButton from "./stars-index-button"

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
  const { coursesToIndex, removeCourseToIndex } = useBoundState()
  const [open, setOpen] = useState(false)

  const pathname = usePathname()

  if (!pathname.includes("stars")) return <></>

  return (
    <>
      <div className="absolute bottom-0 right-0 h-[200px] w-screen md:hidden"></div>

      <div
        className="fixed bottom-0 right-0 z-[11] flex h-[50px] w-screen items-center justify-center shadow-lg hover:cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 md:hidden"
        onClick={() => setOpen(true)}>
        <span className="text-center">Click to Edit Timetable</span>
      </div>

      <Button onClick={() => setOpen(true)} className="hidden md:block">
        Add Courses
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[20] flex w-[97%] max-w-4xl flex-col justify-start px-2 py-5 md:px-5">
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
                        <tr className="h-[50px]" key={courseKey}>
                          <td className="w-[75px] text-center text-sm">
                            {course.key}
                          </td>

                          <td className="hidden md:table-cell">
                            <p className="line-clamp-1 text-sm capitalize">
                              {course.title
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-zA-Z ]/g, "")}
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
                              <StarsIndexButton courseKey={courseKey} />
                            </div>
                          </td>

                          <td>
                            <div className="flex w-full items-center justify-center">
                              <Button
                                variant="ghost"
                                onClick={() => removeCourseToIndex(courseKey)}
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

          <DialogFooter className="justify-start md:justify-end ">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
