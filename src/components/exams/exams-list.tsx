"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import posthog from "posthog-js"

import type { ApiExam } from "@/lib/server/get-module-exam-data"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

type GroupBy = "date" | "prefix" | "none"

interface Props {
  exams: ApiExam[]
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

function getPrefixLabel(prefix: string): string {
  return EXAM_PREFIX_LABELS[prefix] ?? prefix
}

function getModulePrefix(code: string) {
  return code.match(/^[A-Z]+/)?.[0] ?? "#"
}

function parseDateForSort(dateStr: string): number {
  return new Date(dateStr).getTime()
}

function groupExams(exams: ApiExam[], groupBy: GroupBy) {
  if (groupBy === "none") return null

  const groups = new Map<string, ApiExam[]>()

  exams.forEach((exam) => {
    const key =
      groupBy === "date" ? exam.date : getPrefixLabel(getModulePrefix(exam.key))
    const existing = groups.get(key) ?? []
    existing.push(exam)
    groups.set(key, existing)
  })

  const entries = Array.from(groups.entries())

  if (groupBy === "date") {
    entries.sort(([a], [b]) => parseDateForSort(a) - parseDateForSort(b))
  } else {
    entries.sort(([a], [b]) => a.localeCompare(b))
  }

  return entries.map(([key, items]) => ({
    key,
    items: items.sort((a, b) => a.key.localeCompare(b.key))
  }))
}

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function ExamTable({
  items,
  showDate = true
}: {
  items: ApiExam[]
  showDate?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-lg border-2">
      {/* Header — desktop only */}
      <div className="bg-muted/50 hidden items-center gap-3 border-b px-3 py-2 md:flex">
        <span className="text-muted-foreground w-[88px] shrink-0 text-xs font-medium tracking-wide uppercase">
          Module
        </span>
        <span className="text-muted-foreground flex-1 text-xs font-medium tracking-wide uppercase">
          Name
        </span>
        <span className="text-muted-foreground shrink-0 text-right text-xs font-medium tracking-wide uppercase">
          {showDate ? "Date & Time" : "Time"}
        </span>
      </div>
      <div className="divide-y">
        {items.map((exam) => (
          <a
            key={exam.key}
            href={`/mods/${exam.key}`}
            className="hover:bg-accent flex items-center gap-3 px-3 py-2.5 transition-colors">
            {/* Mobile: stacked */}
            <div className="min-w-0 flex-1 md:hidden">
              <span className="text-muted-foreground font-mono text-sm font-medium">
                {exam.key}
              </span>
              <p className="mt-0.5 text-sm leading-snug">
                {toTitleCase(exam.name)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                {showDate && <span>{exam.date} · </span>}
                {exam.start_time} – {exam.end_time}
              </p>
            </div>

            {/* Desktop: inline */}
            <span className="text-muted-foreground hidden w-[88px] shrink-0 font-mono text-sm md:block">
              {exam.key}
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-sm md:block">
              {toTitleCase(exam.name)}
            </span>
            <span className="text-muted-foreground hidden shrink-0 text-right text-xs tabular-nums md:block">
              {showDate && <span className="block">{exam.date}</span>}
              {exam.start_time} – {exam.end_time}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

const DISCLAIMER =
  "The Exam information shown may be subject to changes. Students are to check the finalised exam timetable with exam seat information, which will be available at the 'Examination Seating Arrangement' webpage, 2 weeks before start of examination."

export default function ExamsList({ exams }: Props) {
  const [search, setSearch] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("none")
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    const q = debouncedSearch.trim()
    if (q) posthog.capture("exams_searched", { search_term: q })
  }, [debouncedSearch])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return exams
    return exams.filter(
      (e) => e.key.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    )
  }, [exams, search])

  const groups = useMemo(
    () => groupExams(filtered, groupBy),
    [filtered, groupBy]
  )

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-700 dark:text-amber-400">
        {DISCLAIMER}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by module code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={groupBy}
          onValueChange={(v) => {
            setGroupBy(v as GroupBy)
            posthog.capture("exams_grouped", { group_by: v })
          }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            <SelectItem value="date">Group by Date</SelectItem>
            <SelectItem value="prefix">Group by School</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground text-sm">
        {filtered.length} exam{filtered.length !== 1 ? "s" : ""}
        {search ? " found" : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No exams match your search.
        </p>
      ) : groups ? (
        <div className="space-y-8">
          {groups.map(({ key, items }) => (
            <section key={key} className="space-y-3">
              <h2 className="text-base font-semibold">{key}</h2>
              <ExamTable items={items} showDate={groupBy !== "date"} />
            </section>
          ))}
        </div>
      ) : (
        <ExamTable items={filtered} showDate />
      )}
    </div>
  )
}
