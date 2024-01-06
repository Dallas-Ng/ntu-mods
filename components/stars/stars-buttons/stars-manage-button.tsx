"use client"

import { Fragment } from "react"
import { useBoundState } from "@/state/bound-state"
import { X } from "lucide-react"

import { C_DATA } from "@/lib/consolidated-data"
import { formatTitle } from "@/lib/stars.lib"
import { Button } from "@/components/ui/button"
import { DrawerDialog } from "@/components/drawer-dialog"

import StarsCourseSelect from "../stars-course-select"
import StarsIndexButton from "./stars-index-button"

export default function StarsManageButton() {
  const { coursesToIndex, removeCourseToIndex } = useBoundState()
  const objCtI = Object.entries(coursesToIndex)

  return (
    <>
      <DrawerDialog
        trigger={
          <div>
            <Button className="fixed bottom-0 left-0 z-[11] h-[50px] w-screen rounded-none md:hidden">
              Click to Edit Timetable
            </Button>

            <Button className="hidden md:block">Add Courses</Button>
          </div>
        }
        content={
          <>
            <div className="mb-4 flex justify-center">
              <StarsCourseSelect btnClassName="md:w-[500px] w-[90vw] h-50px" />
            </div>

            <div className="flex h-full w-full flex-col items-start overflow-y-auto px-5">
              <div className="sticky top-0 z-20 flex w-full items-center justify-between gap-2 bg-background pb-1 text-xs">
                <div className="w-[75px]">Code</div>

                <div className="w-full text-left">Name</div>

                <div className="mr-[52px]">Index</div>
              </div>

              {objCtI.map(([courseKey]) => {
                const course = C_DATA[courseKey]

                return (
                  <Fragment key={courseKey}>
                    <StarsIndexButton
                      courseKey={courseKey}
                      trigger={
                        <div className="flex w-full cursor-pointer items-center justify-between py-2">
                          <div className="flex w-full justify-between gap-2 text-sm">
                            <div className="w-[75px]">{course.key}</div>

                            <p className="line-clamp-1 w-full text-left text-sm capitalize">
                              {formatTitle(course.title)}
                            </p>

                            <div className="mr-[12px]">
                              {coursesToIndex[courseKey][0].key}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault()
                              removeCourseToIndex(courseKey)
                            }}
                            className="text-gray-500 transition-colors duration-100 hover:cursor-pointer">
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      }
                    />

                    <hr className="w-full" />
                  </Fragment>
                )
              })}

              {objCtI.length > 0 && (
                <p className="w-full p-4 text-center text-sm text-gray-500">
                  Click on a row to choose your index
                </p>
              )}
            </div>
          </>
        }
      />
    </>
  )
}
