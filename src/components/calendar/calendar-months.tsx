import { useId, useMemo, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { useHydrated } from "@/hooks/use-hydrated"
import { useMediaQuery } from "@/hooks/use-media-query"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"

import { singaporeToday } from "./singapore-today"

/**
 * Colours by meaning. An ordinary teaching day is a plain white chip, so the
 * days that differ stand out: recess is amber (a break), revision and exams are
 * red (what matters most), and a day off is green, as Google Calendar marks
 * holidays. Days outside the semester have no chip at all.
 */
const WEEK_FILL: Record<WeekKind, string> = {
  teaching: "bg-background",
  recess:
    "bg-warning-subtle text-warning ring-warning ring-1 ring-inset font-medium",
  exams:
    "bg-destructive-subtle text-destructive ring-destructive ring-1 ring-inset font-semibold"
}
const HOLIDAY_FILL =
  "bg-success-subtle text-success ring-success ring-1 ring-inset font-semibold"
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

type Highlight = Set<string> | undefined

/** The look of one day, shared by the grid and Dates to know samples. */
const dayClass = (categories: Set<DayCategory>, today: boolean) => {
  const kind = (["exams", "recess", "teaching"] as const).find((k) =>
    categories.has(k)
  )
  return cn(
    "relative mx-auto flex aspect-square w-full max-w-9 items-center justify-center rounded-lg text-xs tabular-nums",
    today
      ? cn(TODAY, "rounded-full")
      : categories.has("holiday")
        ? HOLIDAY_FILL
        : kind && WEEK_FILL[kind]
  )
}

const Marker = ({
  categories,
  today = false
}: {
  categories: Set<DayCategory>
  today?: boolean
}) => {
  const marker = (["partial", "event"] as const).find((c) => categories.has(c))
  if (!marker || categories.has("holiday")) return null
  return (
    <span
      aria-hidden
      className={cn(
        "absolute bottom-[0.15rem] left-1/2 h-0.5 w-2 -translate-x-1/2 rounded-full",
        today ? "bg-current" : MARKER[marker]
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
  const hit = highlight?.has(iso)
  const className = cn(
    dayClass(categories, today),
    "max-w-5 self-center sm:max-w-7",
    !weekday &&
      !today &&
      !categories.has("holiday") &&
      !categories.has("recess") &&
      !categories.has("exams") &&
      "text-muted-foreground",
    hit && "outline-foreground outline-2",
    hit === false && "opacity-30 contrast-more:opacity-100"
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
      <Tooltip>
        <TooltipTrigger
          aria-label={label}
          className={cn(
            className,
            "outline-foreground hover:opacity-100 hover:outline-2 focus-visible:opacity-100 focus-visible:outline-2"
          )}>
          {number}
          <Marker categories={categories} today={today} />
        </TooltipTrigger>
        <TooltipContent sideOffset={4} className="max-w-64 space-y-1">
          <p className="font-semibold">{formatDayShort(iso)}</p>
          {weekLong && weekday && <p>{weekLong}</p>}
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.text}>{n.text}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

const CalendarCard = ({
  as: Element = "section",
  label,
  title,
  month,
  defaultOpen,
  children
}: {
  as?: "section" | "aside"
  label: string
  title: string
  month?: string
  defaultOpen?: boolean
  children: ReactNode
}) => {
  const panelId = useId()
  const [open, setOpen] = useState<boolean>()
  const expanded = open ?? defaultOpen ?? false
  return (
    <Element
      aria-label={label}
      data-calendar-card={month ?? "dates"}
      data-open={open}
      className={cardVariants({
        className: "min-w-0 self-start px-2 md:px-3 lg:px-4"
      })}>
      <h3 className="md:hidden">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setOpen(!expanded)}
          className="outline-foreground flex w-full items-center justify-between rounded-md py-3 text-left text-base font-semibold hover:underline focus-visible:outline-2 [&[aria-expanded=true]>svg]:rotate-180">
          {title}
          <ChevronDown
            aria-hidden
            className="text-muted-foreground size-4 shrink-0"
          />
        </button>
      </h3>
      <div className="hidden pt-3 pb-2 md:block">
        <SectionHeading as="h3">{title}</SectionHeading>
      </div>
      <div id={panelId} data-calendar-panel className="pb-4 md:pb-3">
        {children}
      </div>
    </Element>
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
  const month = `${grid.year}-${String(grid.month).padStart(2, "0")}`

  return (
    <CalendarCard
      label={name}
      title={MONTH_NAMES[grid.month - 1]}
      month={month}
      defaultOpen={today?.startsWith(month)}>
      <div
        role="grid"
        aria-label={name}
        className="grid grid-cols-[1rem_repeat(7,minmax(0,1fr))] grid-rows-[repeat(7,1.25rem)] gap-x-px gap-y-[3px] sm:grid-cols-[1.25rem_repeat(7,minmax(0,1fr))] sm:grid-rows-[repeat(7,1.75rem)] sm:gap-x-1 md:gap-y-0.5">
        <div role="row" className="contents">
          <div
            role="columnheader"
            aria-label="Teaching week"
            className="text-muted-foreground flex items-center justify-center text-xs">
            Wk
          </div>
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              role="columnheader"
              className="text-muted-foreground flex items-center justify-center text-xs font-medium">
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
                  "text-muted-foreground flex items-center justify-center text-xs tabular-nums",
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
    </CalendarCard>
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

const Sample = ({ category, day }: { category: DayCategory; day: number }) => {
  const categories = new Set<DayCategory>(["teaching", category])
  return (
    <span
      aria-hidden
      className={cn(
        dayClass(categories, false),
        "mx-0 size-6 max-w-6 shrink-0"
      )}>
      {day}
      <Marker categories={categories} />
    </span>
  )
}

interface Props {
  calendars: AcademicYearCalendar[]
}

/** A row in the side card that highlights its days while hovered or focused. */
const HighlightRow = ({
  onHighlight,
  onClear,
  children
}: {
  onHighlight?: () => void
  onClear: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onMouseEnter={onHighlight}
    onFocus={onHighlight}
    onMouseLeave={onClear}
    onBlur={onClear}
    className="hover:bg-accent outline-foreground flex w-full items-start gap-1 rounded-lg px-2 py-1.5 text-left text-xs focus-visible:outline-2 sm:gap-3 sm:text-sm">
    {children}
  </button>
)

const CalendarMonths = ({ calendars }: Props) => {
  const datesOpenByDefault = useMediaQuery("(width < 40rem)")
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
  const ayOf = (c: AcademicYearCalendar) =>
    `AY${c.academicYear}/${String(c.academicYear + 1).slice(2)}`

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8">
        {blocks.map(({ code, calendar, sem, months, dates }) => {
          const id = `s${code.replace(";", "-")}`
          const end = sem.revisionAndExams?.end
          return (
            <section key={code} aria-labelledby={id} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <SectionHeading id={id}>
                  {semesterName(code)}, {ayOf(calendar)}
                  {calendar.indicative ? " (provisional)" : ""}
                </SectionHeading>
                {end && (
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {formatRange(sem.teachingWeeks["1"], end)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,30%)] lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[repeat(auto-fill,minmax(min(100%,14.5rem),1fr))]">
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
                  <CalendarCard
                    as="aside"
                    label={`Dates to know, ${semesterName(code)}`}
                    title="Dates to know"
                    defaultOpen={datesOpenByDefault}>
                    <ul className="-mx-2">
                      {dates.map((d) => (
                        <li key={`${d.start}-${d.text}`}>
                          <HighlightRow
                            onHighlight={() =>
                              setHighlight(datesIn(d.start, d.end))
                            }
                            onClear={clear}>
                            <Sample
                              category={d.category}
                              day={Number(d.start.slice(8))}
                            />
                            <span className="min-w-0 break-words">
                              <span className="text-muted-foreground block text-xs tabular-nums">
                                {d.start === d.end
                                  ? formatDayShort(d.start)
                                  : formatRange(d.start, d.end)}
                              </span>
                              {d.text}
                            </span>
                          </HighlightRow>
                        </li>
                      ))}
                    </ul>
                  </CalendarCard>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export default CalendarMonths
