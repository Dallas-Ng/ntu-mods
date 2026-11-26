import { useMemo, useState } from "react"

import { useHydrated } from "@/hooks/use-hydrated"
import type {
  AcademicYearCalendar,
  SemesterCalendar
} from "@/lib/academic-calendar"
import {
  dayCategories,
  dayNotes,
  mondayOf,
  semesterMonths,
  weekLabel,
  type DayCategory,
  type DayNote,
  type MonthGrid,
  type WeekKind
} from "@/lib/academic-calendar-days"
import { semesterName } from "@/lib/academic-calendar-events"
import {
  formatDayShort,
  formatRange,
  weekdayShort
} from "@/lib/calendar-format"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/header"
import { cardVariants } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

import { singaporeToday } from "./singapore-today"

/**
 * Colours by meaning, from calm to loud: an ordinary teaching day is a soft
 * blue, recess is amber (a break), revision and exams are red (what matters
 * most), and a day off is green, as Google Calendar marks holidays.
 */
export const WEEK_FILL: Record<WeekKind, string> = {
  teaching: "bg-primary-subtle",
  recess: "bg-warning-subtle",
  exams: "bg-destructive-subtle text-destructive font-semibold"
}
const HOLIDAY_FILL = "bg-success-subtle text-success font-semibold"
/** The bar under a day that is only partly affected, or has an event. */
const MARKER: Partial<Record<DayCategory, string>> = {
  partial: "bg-success",
  event: "bg-primary"
}
const TODAY = "bg-foreground text-background font-semibold"

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

/** What the calendar is highlighting: a legend category or some dates. */
type Highlight = { category: DayCategory } | { dates: Set<string> } | undefined

const matches = (
  highlight: Highlight,
  iso: string,
  categories: Set<DayCategory>
) =>
  !highlight
    ? undefined
    : "category" in highlight
      ? categories.has(highlight.category)
      : highlight.dates.has(iso)

/** The look of one day, shared by the grid and the legend's samples. */
const dayClass = (categories: Set<DayCategory>, today: boolean) => {
  const kind = (["exams", "recess", "teaching"] as const).find((k) =>
    categories.has(k)
  )
  return cn(
    "relative mx-auto flex aspect-square w-full max-w-9 items-center justify-center rounded-lg text-sm tabular-nums transition-[opacity,box-shadow] motion-reduce:transition-none",
    kind && WEEK_FILL[kind],
    categories.has("holiday") && HOLIDAY_FILL,
    today && cn(TODAY, "rounded-full")
  )
}

const Marker = ({ categories }: { categories: Set<DayCategory> }) => {
  const marker = (["partial", "event"] as const).find((c) => categories.has(c))
  if (!marker || categories.has("holiday")) return null
  return (
    <span
      aria-hidden
      className={cn(
        "absolute bottom-1 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full",
        MARKER[marker]
      )}
    />
  )
}

interface DayProps {
  iso: string
  weekLong?: string
  calendar: AcademicYearCalendar
  today: boolean
  highlight: Highlight
}

const Day = ({ iso, weekLong, calendar, today, highlight }: DayProps) => {
  const categories = dayCategories(calendar, iso)
  const notes: DayNote[] = dayNotes(calendar, iso)
  const weekday = !["Sat", "Sun"].includes(weekdayShort(iso))
  const hit = matches(highlight, iso, categories)
  const className = cn(
    dayClass(categories, today),
    !weekday && !categories.has("holiday") && !today && "text-muted-foreground",
    hit === true && "ring-foreground ring-2",
    hit === false && "opacity-30"
  )
  const label = [
    formatDayShort(iso),
    weekday && weekLong,
    ...notes.map((n) => n.text),
    today && "Today"
  ]
    .filter(Boolean)
    .join(". ")
  const number = Number(iso.slice(8))

  if (notes.length === 0)
    return (
      <div role="gridcell" aria-label={label} className={className}>
        {number}
      </div>
    )

  return (
    <div role="gridcell" className="contents">
      <Popover>
        <PopoverTrigger
          aria-label={label}
          // A ring on hover, not an accent fill: the fill is the day's meaning.
          className={cn(
            className,
            "hover:ring-ring focus-visible:ring-ring hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
          )}>
          {number}
          <Marker categories={categories} />
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2 text-sm">
          <p className="font-semibold">{formatDayShort(iso)}</p>
          {weekLong && weekday && (
            <p className="text-muted-foreground text-xs">{weekLong}</p>
          )}
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.text}>{n.text}</li>
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
  highlight: Highlight
}

const Month = ({ grid, calendar, sem, today, highlight }: MonthProps) => {
  const name = `${MONTH_NAMES[grid.month - 1]} ${grid.year}`

  return (
    <section
      aria-label={name}
      className={cardVariants({ className: "space-y-3 p-3 sm:p-4" })}>
      <SectionHeading as="h3">{MONTH_NAMES[grid.month - 1]}</SectionHeading>
      <div
        role="grid"
        aria-label={name}
        className="grid grid-cols-[1.25rem_repeat(7,minmax(0,1fr))] gap-1">
        <div role="row" className="contents">
          <div
            role="columnheader"
            aria-label="Teaching week"
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
                aria-label={week?.long ?? "Outside the semester"}
                className={cn(
                  "text-muted-foreground flex items-center text-xs tabular-nums",
                  current && "text-foreground font-semibold"
                )}>
                {week?.short}
              </div>
              {row.days.map((iso, column) =>
                iso ? (
                  <Day
                    key={iso}
                    iso={iso}
                    weekLong={week?.long}
                    calendar={calendar}
                    today={iso === today}
                    highlight={highlight}
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

interface DateToKnow {
  start: string
  end: string
  text: string
  category: DayCategory
}

/** The holidays, early finishes and events in a semester, in date order. */
const datesToKnow = (
  calendar: AcademicYearCalendar,
  months: MonthGrid[]
): DateToKnow[] => {
  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  const first = iso(months[0].year, months[0].month, 1)
  const end = months[months.length - 1]
  const last = iso(end.year, end.month, 31)
  const within = (d: string) => first <= d && d <= last
  const items: DateToKnow[] = [
    ...calendar.noClassDays
      .filter((d) => within(d.date))
      // A Saturday holiday changes nothing for classes; a Sunday one has
      // its Monday replacement listed instead.
      .filter((d) => !["Sat", "Sun"].includes(weekdayShort(d.date)))
      .map((d) => ({
        start: d.date,
        end: d.date,
        text: `${d.name}, no classes`,
        category: "holiday" as const
      })),
    ...calendar.earlyDismissals
      .filter((d) => within(d.date))
      .map((d) => ({
        start: d.date,
        end: d.date,
        text: `${d.name}, classes end at ${d.until}`,
        category: "partial" as const
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
        category: e.noClasses ? ("partial" as const) : ("event" as const)
      }))
  ]
  return items.sort((a, b) => a.start.localeCompare(b.start))
}

const datesIn = (start: string, end: string) => {
  const dates = new Set<string>()
  for (
    let d = new Date(`${start}T00:00:00Z`);
    d.toISOString().slice(0, 10) <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  )
    dates.add(d.toISOString().slice(0, 10))
  return dates
}

/** A legend swatch drawn exactly like a day in the grid. */
const Sample = ({
  category,
  day = 8
}: {
  category: DayCategory | "today"
  day?: number
}) => {
  const categories = new Set<DayCategory>(
    category === "today"
      ? []
      : category === "partial" || category === "event"
        ? ["teaching", category]
        : [category]
  )
  return (
    <span
      aria-hidden
      className={cn(
        dayClass(categories, category === "today"),
        "mx-0 size-7 max-w-7 shrink-0"
      )}>
      {day}
      <Marker categories={categories} />
    </span>
  )
}

const LEGEND: { category: DayCategory | "today"; label: string }[] = [
  { category: "teaching", label: "Teaching week" },
  { category: "recess", label: "Recess week" },
  { category: "exams", label: "Revision and exams" },
  { category: "holiday", label: "Holiday, no classes" },
  { category: "partial", label: "Classes end early" },
  { category: "event", label: "Key event" },
  { category: "today", label: "Today" }
]

interface Props {
  calendars: AcademicYearCalendar[]
}

/**
 * Both semesters as month cards. Hovering a legend item or a date to know
 * highlights the matching days. "Today" is only known in the browser, so it is
 * marked after hydration and the prerendered HTML is the same for all.
 */
const CalendarMonths = ({ calendars }: Props) => {
  const hydrated = useHydrated()
  const today = hydrated ? singaporeToday() : undefined
  const [highlight, setHighlight] = useState<Highlight>()
  const clear = () => setHighlight(undefined)

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

  return (
    <div className="space-y-10">
      <ul
        aria-label="Legend"
        className="flex flex-wrap gap-1"
        onMouseLeave={clear}>
        {LEGEND.map(({ category, label }) => (
          <li key={category}>
            <button
              type="button"
              onMouseEnter={() =>
                category !== "today" && setHighlight({ category })
              }
              onFocus={() => category !== "today" && setHighlight({ category })}
              onBlur={clear}
              className="hover:bg-accent flex items-center gap-2 rounded-lg py-1 pr-2.5 pl-1 text-sm">
              <Sample category={category} />
              {label}
            </button>
          </li>
        ))}
      </ul>

      {blocks.map(({ code, calendar, sem, months, dates }) => {
        const id = `s${code.replace(";", "-")}`
        const ay = `AY${calendar.academicYear}/${String(calendar.academicYear + 1).slice(2)}`
        return (
          <section key={code} aria-labelledby={id} className="space-y-4">
            <div className="space-y-1">
              <SectionHeading id={id}>
                {semesterName(code)}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  {ay}
                  {calendar.indicative ? ", provisional" : ""}
                </span>
              </SectionHeading>
              <p className="text-muted-foreground text-sm">
                Teaching from {formatDayShort(sem.teachingWeeks["1"])}
                {sem.recess
                  ? `. Recess ${formatRange(sem.recess.start, sem.recess.end)}`
                  : ""}
                {sem.revisionAndExams
                  ? `. Revision and exams ${formatRange(sem.revisionAndExams.start, sem.revisionAndExams.end)}.`
                  : "."}
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(14.5rem,1fr))] gap-3">
                {months.map((grid) => (
                  <Month
                    key={`${grid.year}-${grid.month}`}
                    grid={grid}
                    calendar={calendar}
                    sem={sem}
                    today={today}
                    highlight={highlight}
                  />
                ))}
              </div>
              {dates.length > 0 && (
                <aside
                  aria-label={`Dates to know, ${semesterName(code)}`}
                  className="space-y-2 lg:sticky lg:top-24 lg:self-start">
                  <SectionHeading as="h3">Dates to know</SectionHeading>
                  <ul className="-mx-2" onMouseLeave={clear}>
                    {dates.map((d) => (
                      <li key={`${d.start}-${d.text}`}>
                        <button
                          type="button"
                          onMouseEnter={() =>
                            setHighlight({ dates: datesIn(d.start, d.end) })
                          }
                          onFocus={() =>
                            setHighlight({ dates: datesIn(d.start, d.end) })
                          }
                          onBlur={clear}
                          className="hover:bg-accent flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm">
                          <Sample
                            category={d.category}
                            day={Number(d.start.slice(8))}
                          />
                          <span className="min-w-0">
                            <span className="text-muted-foreground block text-xs tabular-nums">
                              {d.start === d.end
                                ? formatDayShort(d.start)
                                : formatRange(d.start, d.end)}
                            </span>
                            {d.text}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default CalendarMonths
