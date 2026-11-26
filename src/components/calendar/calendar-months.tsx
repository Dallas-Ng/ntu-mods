import { useEffect, useMemo, useState } from "react"

import { useHydrated } from "@/hooks/use-hydrated"
import type {
  AcademicYearCalendar,
  SemesterCalendar
} from "@/lib/academic-calendar"
import {
  dayNotes,
  mondayOf,
  semesterMonths,
  weekLabel,
  type DayNote,
  type MonthGrid,
  type WeekKind
} from "@/lib/academic-calendar-days"
import { calendarStatus, semesterName } from "@/lib/academic-calendar-events"
import {
  formatDayShort,
  formatRange,
  weekdayShort
} from "@/lib/calendar-format"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/header"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { singaporeToday } from "./singapore-today"

/** Week fills, matching the colours of NTU's own calendar PDF. */
export const WEEK_FILL: Record<WeekKind, string> = {
  teaching: "bg-warning-subtle",
  recess: "bg-primary-subtle",
  exams: "bg-destructive-subtle"
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]

interface DayCellProps {
  iso: string
  column: number
  kind?: WeekKind
  weekLong?: string
  notes: DayNote[]
  noClasses: boolean
  today: boolean
}

const DayCell = ({
  iso,
  column,
  kind,
  weekLong,
  notes,
  noClasses,
  today
}: DayCellProps) => {
  const weekend = column >= 5
  const day = Number(iso.slice(8))
  const className = cn(
    "relative flex h-8 items-center justify-center rounded-md text-sm tabular-nums",
    !weekend && kind && WEEK_FILL[kind],
    weekend && "text-muted-foreground",
    noClasses && "text-destructive font-semibold",
    today && "ring-foreground ring-2 ring-inset"
  )
  const label = [
    formatDayShort(iso),
    !weekend && weekLong,
    ...notes.map((n) => n.text),
    today && "Today"
  ]
    .filter(Boolean)
    .join(". ")

  if (notes.length === 0)
    return (
      <div role="gridcell" aria-label={label} className={className}>
        {day}
      </div>
    )

  return (
    <div role="gridcell">
      <Popover>
        <PopoverTrigger
          aria-label={label}
          // A ring, not an accent fill, on hover: the fill is the week type.
          className={cn(
            className,
            "hover:ring-ring focus-visible:ring-ring w-full hover:ring-2 hover:ring-inset focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
          )}>
          {day}
          <span
            aria-hidden
            className={cn(
              "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
              noClasses ? "bg-destructive" : "bg-foreground"
            )}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2 text-sm">
          <p className="font-semibold">{formatDayShort(iso)}</p>
          {weekLong && !weekend && (
            <p className="text-muted-foreground text-xs">{weekLong}</p>
          )}
          <ul className="space-y-1">
            {notes.map((n) => (
              <li
                key={n.text}
                className={cn(
                  n.type === "holiday" && "text-destructive font-medium"
                )}>
                {n.text}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface MonthProps {
  grid: MonthGrid
  calendar: AcademicYearCalendar
  sem: SemesterCalendar
  today?: string
}

const Month = ({ grid, calendar, sem, today }: MonthProps) => {
  const noClassDates = new Set(calendar.noClassDays.map((d) => d.date))
  const name = `${MONTH_NAMES[grid.month - 1]} ${grid.year}`

  return (
    <section aria-label={name} className="space-y-2">
      <SectionHeading as="h3">{name}</SectionHeading>
      <div
        role="grid"
        aria-label={name}
        className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-1">
        <div role="row" className="contents">
          <div
            role="columnheader"
            className="text-muted-foreground flex h-6 items-center text-xs">
            Wk
          </div>
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              role="columnheader"
              className="text-muted-foreground flex h-6 items-center justify-center text-xs font-medium">
              {d}
            </div>
          ))}
        </div>
        {grid.rows.map((row) => {
          const week = weekLabel(sem, row.monday)
          const current = !!today && mondayOf(today) === row.monday
          return (
            <div key={row.monday} role="row" className="contents">
              <div
                role="rowheader"
                aria-label={week?.long ?? "Not a semester week"}
                className={cn(
                  "text-muted-foreground flex h-8 items-center text-xs tabular-nums",
                  current && "text-foreground font-semibold"
                )}>
                {week?.short}
              </div>
              {row.days.map((iso, column) =>
                iso ? (
                  <DayCell
                    key={iso}
                    iso={iso}
                    column={column}
                    kind={week?.kind}
                    weekLong={week?.long}
                    notes={dayNotes(calendar, iso)}
                    noClasses={noClassDates.has(iso)}
                    today={iso === today}
                  />
                ) : (
                  <div key={column} role="gridcell" aria-hidden />
                )
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** The holidays, early finishes and events in a semester, in date order. */
const datesToKnow = (calendar: AcademicYearCalendar, months: MonthGrid[]) => {
  const first = `${months[0].year}-${String(months[0].month).padStart(2, "0")}-01`
  const lastMonth = months[months.length - 1]
  const last = `${lastMonth.year}-${String(lastMonth.month).padStart(2, "0")}-31`
  const within = (iso: string) => first <= iso && iso <= last
  const items: {
    start: string
    end: string
    text: string
    type: DayNote["type"]
  }[] = [
    ...calendar.noClassDays
      .filter((d) => within(d.date))
      .filter(
        // A Saturday holiday changes nothing for classes; a Sunday one has
        // its Monday replacement listed instead.
        (d) => !["Sat", "Sun"].includes(weekdayShort(d.date))
      )
      .map((d) => ({
        start: d.date,
        end: d.date,
        text: `${d.name}, no classes`,
        type: "holiday" as const
      })),
    ...calendar.earlyDismissals
      .filter((d) => within(d.date))
      .map((d) => ({
        start: d.date,
        end: d.date,
        text: `${d.name}, classes end at ${d.until}`,
        type: "early" as const
      })),
    ...calendar.events
      .filter((e) => within(e.start))
      .map((e) => ({
        start: e.start,
        end: e.end,
        text: e.noClasses
          ? `${e.name}, no classes ${e.noClasses.from} to ${e.noClasses.to}`
          : e.note
            ? `${e.name} (${e.note})`
            : e.name,
        type: e.noClasses ? ("noClasses" as const) : ("event" as const)
      }))
  ]
  return items.sort((a, b) => a.start.localeCompare(b.start))
}

interface Props {
  calendars: AcademicYearCalendar[]
}

/**
 * Each semester as month grids, shaded like NTU's PDF, with the dates that
 * change classes beside them. "Today" is only known in the browser, so it is
 * marked after hydration and the prerendered HTML stays the same for all.
 */
const CalendarMonths = ({ calendars }: Props) => {
  const hydrated = useHydrated()
  const today = hydrated ? singaporeToday() : undefined
  const blocks = useMemo(
    () =>
      calendars.flatMap((calendar) =>
        Object.entries(calendar.semesters).map(([code, sem]) => {
          const months = semesterMonths(sem)
          return {
            code,
            calendar,
            sem,
            months,
            dates: months.length ? datesToKnow(calendar, months) : []
          }
        })
      ),
    [calendars]
  )

  // Open on the semester running now (or the next one) once "now" is known.
  // Before that, and in the prerendered HTML, the first semester is shown.
  const [selected, setSelected] = useState(blocks[0]?.code ?? "")
  useEffect(() => {
    if (!today) return
    const status = calendarStatus(calendars, today)
    const code =
      status.kind === "between" ? status.next?.semester : status.semester
    if (code && blocks.some((b) => b.code === code)) setSelected(code)
  }, [today, calendars, blocks])

  const multipleYears =
    new Set(blocks.map((b) => b.calendar.academicYear)).size > 1

  return (
    <Tabs value={selected} onValueChange={setSelected} className="gap-6">
      <TabsList className="w-full sm:w-auto sm:self-start">
        {blocks.map(({ code, calendar }) => (
          <TabsTrigger key={code} value={code} className="flex-1 sm:flex-none">
            {semesterName(code)}
            {multipleYears
              ? ` AY${String(calendar.academicYear).slice(2)}/${String(calendar.academicYear + 1).slice(2)}`
              : ""}
          </TabsTrigger>
        ))}
      </TabsList>
      {blocks.map(({ code, calendar, sem, months, dates }) => {
        const id = `s${code.replace(";", "-")}`
        const ay = `AY${calendar.academicYear}/${String(calendar.academicYear + 1).slice(2)}`
        return (
          // Mounted while hidden, so the prerendered page carries every
          // semester for search engines and readers without JavaScript.
          <TabsContent
            key={code}
            value={code}
            forceMount
            className="data-[state=inactive]:hidden">
            <section aria-labelledby={id} className="space-y-4">
              <div className="space-y-1">
                <SectionHeading id={id}>
                  {semesterName(code)}, {ay}
                  {calendar.indicative ? " (provisional)" : ""}
                </SectionHeading>
                <p className="text-muted-foreground text-sm">
                  Teaching starts {formatDayShort(sem.teachingWeeks["1"])}
                  {sem.recess
                    ? `, recess week is ${formatRange(sem.recess.start, sem.recess.end)}`
                    : ""}
                  {sem.revisionAndExams
                    ? `, and revision and exams run ${formatRange(sem.revisionAndExams.start, sem.revisionAndExams.end)}.`
                    : "."}
                </p>
              </div>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                  {months.map((grid) => (
                    <Month
                      key={`${grid.year}-${grid.month}`}
                      grid={grid}
                      calendar={calendar}
                      sem={sem}
                      today={today}
                    />
                  ))}
                </div>
                {dates.length > 0 && (
                  <aside
                    aria-label={`Dates to know, ${semesterName(code)}`}
                    className="space-y-3">
                    <SectionHeading as="h3">Dates to know</SectionHeading>
                    <ul className="space-y-3">
                      {dates.map((d) => (
                        <li
                          key={`${d.start}-${d.text}`}
                          className="flex gap-3 text-sm">
                          <span
                            aria-hidden
                            className={cn(
                              "mt-1.5 size-2 shrink-0 rounded-full",
                              d.type === "holiday" || d.type === "noClasses"
                                ? "bg-destructive"
                                : d.type === "early"
                                  ? "bg-warning"
                                  : "bg-foreground"
                            )}
                          />
                          <span className="min-w-0">
                            <span className="text-muted-foreground block text-xs tabular-nums">
                              {d.start === d.end
                                ? formatDayShort(d.start)
                                : formatRange(d.start, d.end)}
                            </span>
                            {d.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}
              </div>
            </section>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

export default CalendarMonths
