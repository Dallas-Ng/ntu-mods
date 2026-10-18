"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"

import { track } from "@/lib/analytics"
import { CODE_QUERY_RE } from "@/lib/filter-modules"
import type { DbExam } from "@/lib/server/db/types"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

type FilterKey = "date" | "school" | "level" | "time"
type Filters = Record<FilterKey, string[]>

const NO_FILTERS: Filters = { date: [], school: [], level: [], time: [] }
const TIME_BUCKETS = ["Morning", "Afternoon", "Evening"] as const

interface Props {
  exams: DbExam[]
}

const EXAM_PREFIX_LABELS: Record<string, string> = {
  ACC: "Accountancy",
  ADM: "Art, Design & Media",
  BG: "Biological Sciences",
  BMS: "Biomedical Sciences",
  BS: "Biological Sciences",
  BUS: "Business",
  CBE: "Chemical & Biomolecular Engineering",
  CE: "Computer Engineering",
  CEE: "Civil & Environmental Engineering",
  CHEM: "Chemistry & Biological Chemistry",
  CHIN: "Chinese",
  CS: "Communication Studies",
  CSC: "Computer Science",
  CV: "Civil & Environmental Engineering",
  ECON: "Economics",
  EE: "Electrical & Electronic Engineering",
  EEE: "Electrical & Electronic Engineering",
  EESS: "Environmental Earth Systems Science",
  ELH: "English",
  ES: "Earth Sciences",
  HIST: "History",
  ICC: "Interdisciplinary Collaborative Courses",
  LMS: "Linguistics & Multilingual Studies",
  MA: "Mechanical & Aerospace Engineering",
  MAT: "Materials Engineering",
  MATH: "Mathematical Sciences",
  ME: "Mechanical Engineering",
  MED: "Medicine",
  MH: "Mathematical Sciences",
  MS: "Maritime Studies",
  MT: "Maritime Studies",
  NIE: "NIE",
  NTC: "Nanyang Technopreneurship Centre",
  PH: "Physics & Applied Physics",
  PHY: "Physics & Applied Physics",
  PHIL: "Philosophy",
  PPGA: "Public Policy & Global Affairs",
  PSY: "Psychology",
  RE: "Real Estate",
  SOC: "Sociology",
  SOH: "Humanities",
  SPS: "Physical & Mathematical Sciences",
  SSM: "Sport Science & Management",
  SSS: "Social Sciences"
}

const KNOWN_SCHOOLS = new Set(Object.values(EXAM_PREFIX_LABELS))

function getPrefixLabel(prefix: string): string {
  return EXAM_PREFIX_LABELS[prefix] ?? prefix
}

function getModulePrefix(code: string) {
  return code.match(/^[A-Z]+/)?.[0] ?? "#"
}

function parseDateForSort(dateStr: string): number {
  return new Date(dateStr).getTime()
}

function groupByDate(exams: DbExam[]) {
  const groups = new Map<string, DbExam[]>()
  exams.forEach((exam) => {
    groups.set(exam.date, [...(groups.get(exam.date) ?? []), exam])
  })
  return Array.from(groups, ([key, items]) => ({
    key,
    items: items.sort((a, b) => a.key.localeCompare(b.key))
  })).sort((a, b) => parseDateForSort(a.key) - parseDateForSort(b.key))
}

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function toMinutes(t: string) {
  const m = t.match(/(\d+)[.:](\d+)\s*(am|pm)/i)
  if (!m) return NaN
  const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0)
  return h * 60 + Number(m[2])
}

function formatDuration(start: string, end: string) {
  const mins = toMinutes(end) - toMinutes(start)
  if (!(mins > 0)) return null
  return `${Number((mins / 60).toFixed(2))} h`
}

function weekday(dateStr: string) {
  const d = new Date(dateStr)
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { weekday: "long" })
}

function ExamTable({ items }: { items: DbExam[] }) {
  return (
    <div className="bg-muted overflow-hidden rounded-2xl">
      {/* Header, desktop only */}
      <div className="text-muted-foreground hidden items-center gap-4 px-5 py-3 text-xs font-medium md:flex">
        <span className="w-24 shrink-0">Module</span>
        <span className="flex-1">Name</span>
        <span className="w-56 shrink-0 text-right">Time</span>
      </div>
      <div className="divide-background divide-y-2">
        {items.map((exam) => (
          <a
            key={exam.key}
            href={`/mods/${exam.key}`}
            className="hover:bg-accent flex flex-col gap-1 px-5 py-3 transition-colors md:flex-row md:items-center md:gap-4">
            <span className="w-24 shrink-0 text-sm font-semibold whitespace-nowrap">
              {exam.key}
            </span>
            <span className="min-w-0 flex-1 text-sm text-pretty">
              {toTitleCase(exam.name)}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums md:w-56 md:text-right">
              <span className="whitespace-nowrap">
                {exam.start_time} to {exam.end_time}
              </span>
              {formatDuration(exam.start_time, exam.end_time) && (
                <span className="bg-background ml-2 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                  {formatDuration(exam.start_time, exam.end_time)}
                </span>
              )}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function getLevel(code: string) {
  return code.match(/\d/)?.[0] ?? ""
}

function getTimeBucket(start: string) {
  const m = toMinutes(start)
  if (m < 12 * 60) return "Morning"
  return m < 17 * 60 ? "Afternoon" : "Evening"
}

function matchesFilters(exam: DbExam, f: Filters) {
  return (
    (!f.date.length || f.date.includes(exam.date)) &&
    (!f.school.length ||
      f.school.includes(getPrefixLabel(getModulePrefix(exam.key)))) &&
    (!f.level.length || f.level.includes(getLevel(exam.key))) &&
    (!f.time.length || f.time.includes(getTimeBucket(exam.start_time)))
  )
}

interface FilterOption {
  value: string
  label: string
  count: number
}

function FilterChip({
  label,
  options,
  selected,
  onChange
}: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const active = selected.length > 0
  const first = options.find((o) => o.value === selected[0])?.label

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 max-w-full shrink-0 gap-1.5 rounded-full px-3",
            active &&
              "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90 border-transparent dark:border-transparent"
          )}>
          <span className="truncate">
            {active
              ? `${label}: ${first}${selected.length > 1 ? ` +${selected.length - 1}` : ""}`
              : label}
          </span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-72 max-w-[90vw] p-1">
        <div className="max-h-72 overflow-y-auto">
          {options.map((o) => {
            const checked = selected.includes(o.value)
            return (
              <label
                key={o.value}
                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() =>
                    onChange(
                      checked
                        ? selected.filter((v) => v !== o.value)
                        : [...selected, o.value]
                    )
                  }
                />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {o.count}
                </span>
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const DISCLAIMER =
  "The Exam information shown may be subject to changes. Students are to check the finalised exam timetable with exam seat information, which will be available at the 'Examination Seating Arrangement' webpage, 2 weeks before start of examination."

export default function ExamsList({ exams }: Props) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    const q = debouncedSearch.trim()
    if (q) track("exams_searched", { search_term: q })
  }, [debouncedSearch])

  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const hasFilters = Object.values(filters).some((v) => v.length > 0)

  const filterOptions = useMemo(() => {
    const tally = (get: (e: DbExam) => string) => {
      const m = new Map<string, number>()
      exams.forEach((e) => m.set(get(e), (m.get(get(e)) ?? 0) + 1))
      return m
    }
    const toOptions = (
      m: Map<string, number>,
      label: (v: string) => string = (v) => v
    ) =>
      Array.from(m, ([value, count]) => ({ value, label: label(value), count }))

    const dates = toOptions(
      tally((e) => e.date),
      (d) => `${d.replace(/\s\d{4}$/, "")} · ${weekday(d).slice(0, 3)}`
    ).sort((a, b) => parseDateForSort(a.value) - parseDateForSort(b.value))

    return {
      date: dates,
      school: toOptions(
        tally((e) => getPrefixLabel(getModulePrefix(e.key)))
      ).sort(
        (a, b) =>
          Number(!KNOWN_SCHOOLS.has(a.value)) -
            Number(!KNOWN_SCHOOLS.has(b.value)) ||
          a.label.localeCompare(b.label)
      ),
      level: toOptions(
        tally((e) => getLevel(e.key)),
        (l) => `${l}000 level`
      )
        .filter((o) => o.value)
        .sort((a, b) => a.value.localeCompare(b.value)),
      time: TIME_BUCKETS.map((b) => ({
        value: b,
        label: b,
        count: exams.filter((e) => getTimeBucket(e.start_time) === b).length
      }))
    }
  }, [exams])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = hasFilters
      ? exams.filter((e) => matchesFilters(e, filters))
      : exams
    if (!q) return base

    // Code-shaped queries (e.g. "SC") show every module whose code contains
    // it before title-only matches, mirroring /mods search — otherwise
    // searching "SC" buries SC-coded modules under unrelated titles that
    // happen to contain "sc" somewhere in their name.
    if (CODE_QUERY_RE.test(q)) {
      const codeMatches = base.filter((e) => e.key.toLowerCase().includes(q))
      const nameMatches = base.filter(
        (e) =>
          !e.key.toLowerCase().includes(q) && e.name.toLowerCase().includes(q)
      )
      return [...codeMatches, ...nameMatches]
    }

    return base.filter(
      (e) => e.key.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    )
  }, [exams, search, filters, hasFilters])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by module code or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Date"
          options={filterOptions.date}
          selected={filters.date}
          onChange={(v) => setFilters((f) => ({ ...f, date: v }))}
        />
        <FilterChip
          label="School"
          options={filterOptions.school}
          selected={filters.school}
          onChange={(v) => setFilters((f) => ({ ...f, school: v }))}
        />
        <FilterChip
          label="Level"
          options={filterOptions.level}
          selected={filters.level}
          onChange={(v) => setFilters((f) => ({ ...f, level: v }))}
        />
        <FilterChip
          label="Time"
          options={filterOptions.time}
          selected={filters.time}
          onChange={(v) => setFilters((f) => ({ ...f, time: v }))}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 rounded-full px-3"
            onClick={() => setFilters(NO_FILTERS)}>
            Clear all
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No exams match your search or filters.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map(({ key, items }) => (
            <section key={key} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight">
                  {key}
                  <span className="text-muted-foreground ml-2 text-sm font-medium tracking-normal">
                    {weekday(key)}
                  </span>
                </h2>
                <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap tabular-nums">
                  {items.length} exam{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ExamTable items={items} />
            </section>
          ))}
        </div>
      )}

      <p className="text-muted-foreground border-t pt-4 text-xs text-pretty">
        {DISCLAIMER}
      </p>
    </div>
  )
}
