import { useState, useSyncExternalStore } from "react"

import { generateCombinations } from "@/lib/generate-timetable-combinations"
import { DEFAULT_GENERATION_CONFIG } from "@/lib/generation-config"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"

import LandingCarouselControls from "./landing-carousel-controls"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const TIMES = ["0900-1100", "1100-1300", "1300-1500", "1500-1700"]

// Fictional class times keep this example independent of the current semester.
const slot = (type: IndexType, day: number, timeRow: number): Index => ({
  key: "",
  type,
  day,
  time: TIMES[timeRow],
  group: "",
  venue: "",
  remarks: "",
  duration: 4
})

const SAMPLE_INDEXES: Record<string, Indexes> = {
  MH1810: {
    a: [slot("LEC", 1, 1), slot("TUT", 5, 2)],
    b: [slot("LEC", 1, 1), slot("TUT", 3, 2)]
  },
  SC1003: {
    a: [slot("LEC", 2, 0), slot("LAB", 4, 2)],
    b: [slot("LEC", 2, 1), slot("LAB", 3, 2)],
    c: [slot("LEC", 2, 1), slot("LAB", 4, 2)]
  },
  CC0001: {
    a: [slot("SEM", 4, 3)],
    b: [slot("SEM", 5, 1)]
  }
}

const MODULES = Object.keys(SAMPLE_INDEXES)

const subscribe = () => () => {}
const clientReady = () => true
const serverReady = () => false

const TimetableGenerationPreview = () => {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady)
  const [freeFriday, setFreeFriday] = useState(false)
  const [lateStart, setLateStart] = useState(false)
  const [index, setIndex] = useState(0)

  const { combinations } = generateCombinations(MODULES, SAMPLE_INDEXES, {
    ...DEFAULT_GENERATION_CONFIG,
    dayStartTime: lateStart ? 1100 : DEFAULT_GENERATION_CONFIG.dayStartTime,
    blacklistedTimeslots: freeFriday
      ? [{ day: 5, startTime: 800, endTime: 2200 }]
      : []
  })
  const timetable = combinations[index]?.timetable ?? {}
  const classes = Object.entries(timetable).flatMap(([code, key]) =>
    SAMPLE_INDEXES[code][key].map((lesson) => ({ ...lesson, code }))
  )

  return (
    <div className="bg-background flex min-h-90 flex-1 flex-col justify-center gap-3 rounded-lg p-2 sm:p-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="text-muted-foreground mb-2 text-xs">
          Try with sample modules
        </legend>
        {[
          {
            label: "Free Fridays",
            pressed: freeFriday,
            setPressed: setFreeFriday
          },
          {
            label: "Start at 11:00",
            pressed: lateStart,
            setPressed: setLateStart
          }
        ].map(({ label, pressed, setPressed }) => (
          <div key={label} className="relative">
            <Toggle
              className={cn(!ready && "invisible")}
              variant="outline"
              pressed={pressed}
              onPressedChange={(value) => {
                setPressed(value)
                setIndex(0)
              }}>
              {label}
            </Toggle>
            {!ready && (
              <Skeleton
                aria-hidden="true"
                className="absolute inset-0 motion-reduce:animate-none"
              />
            )}
          </div>
        ))}
      </fieldset>

      <table className="w-full table-fixed border-collapse text-center text-xs [--table-padding:1px] sm:[--table-padding:2px]">
        <caption className="sr-only">Generated sample timetable</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="w-8 text-[10px] sm:w-10 sm:text-xs">
              <span className="sr-only">Time</span>
            </th>
            {DAYS.map((day) => (
              <th key={day} scope="col" className="pb-1 font-semibold">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIMES.map((time, row) => (
            <tr key={time} className="h-11 border-b">
              <th
                scope="row"
                className="text-muted-foreground text-[10px] font-medium sm:text-xs">
                {time.slice(0, 2)}:00
                <span className="sr-only"> to {time.slice(5, 7)}:00</span>
              </th>
              {DAYS.map((day, col) => {
                const lesson = classes.find(
                  (lesson) => lesson.day === col + 1 && lesson.time === time
                )
                const style = lesson && getIndexTypeStyle(lesson.type)
                return (
                  <td
                    key={day}
                    className={cn(
                      "border-l",
                      ((freeFriday && col === 4) || (lateStart && row === 0)) &&
                        "bg-primary-subtle"
                    )}>
                    {lesson && style && (
                      <div
                        className={cn(
                          "rounded py-1 leading-tight",
                          style.background,
                          style.text
                        )}>
                        <div className="text-[9px] font-semibold tracking-tight min-[360px]:text-[10px] min-[380px]:text-xs min-[380px]:tracking-normal">
                          {lesson.code}
                        </div>
                        <div>{lesson.type}</div>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex min-h-10 items-center justify-between gap-2">
        <p role="status" className="text-muted-foreground text-xs">
          {combinations.length} clash-free{" "}
          {combinations.length === 1 ? "option" : "options"}
          <span className="sr-only">, showing option {index + 1}</span>
        </p>
        {combinations.length > 1 && (
          <div className="relative">
            <div className={cn(!ready && "invisible")}>
              <LandingCarouselControls
                index={index}
                total={combinations.length}
                prevLabel="Previous timetable option"
                nextLabel="Next timetable option"
                onPrev={() =>
                  setIndex(
                    (index + combinations.length - 1) % combinations.length
                  )
                }
                onNext={() => setIndex((index + 1) % combinations.length)}
              />
            </div>
            {!ready && (
              <Skeleton
                aria-hidden="true"
                className="absolute inset-0 motion-reduce:animate-none"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TimetableGenerationPreview
