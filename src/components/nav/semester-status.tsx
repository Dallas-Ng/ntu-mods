"use client"

import { ChevronDown } from "lucide-react"

import { track } from "@/lib/analytics"
import {
  LATEST_SEMESTER_LABEL,
  LATEST_SEMESTER_LABEL_SHORT
} from "@/lib/semesters"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { TextLink } from "@/components/ui/text-link"

import { formatCount, useDataStatus, useUpdatedLabel } from "./data-status"

const termName = (semester: string) =>
  semester === "S" || semester === "T" ? "Special Term" : `S${semester}`

const Row = ({
  label,
  value,
  detail
}: {
  label: string
  value?: string
  detail?: string
}) => (
  <div className="flex items-baseline justify-between gap-4 px-3 py-2">
    <dt className="text-muted-foreground text-sm">{label}</dt>
    <dd className="text-right text-sm font-medium tabular-nums">
      {value ?? <Skeleton className="ml-auto h-4 w-12" />}
      {detail && (
        <span className="text-muted-foreground block text-xs font-normal">
          {detail}
        </span>
      )}
    </dd>
  </div>
)

/** Mounted only while open, so the numbers are fetched on first open. */
const StatusCard = () => {
  const { status, failed } = useDataStatus()
  const updated = useUpdatedLabel(status?.updated)

  const exams = status?.exams ?? []
  const examsValue = !status
    ? undefined
    : exams.length > 0
      ? formatCount(exams.reduce((sum, e) => sum + e.count, 0))
      : "Not out yet"
  const examsDetail =
    exams.length > 0
      ? `AY${exams[0].year} ${exams.map((e) => termName(e.semester)).join(" and ")}`
      : undefined

  return (
    <>
      <div className="pb-3">
        <p className="text-sm font-semibold">{LATEST_SEMESTER_LABEL}</p>
        <p className="text-muted-foreground text-xs">
          The latest semester on NTUMods
        </p>
      </div>

      {failed ? (
        <p className="text-muted-foreground text-sm">
          Could not load the numbers. Try again later.
        </p>
      ) : (
        <dl className="bg-muted divide-background divide-y-2 rounded-lg">
          <Row
            label="Modules"
            value={status ? formatCount(status.modules) : undefined}
          />
          <Row
            label="Class indexes"
            value={status ? formatCount(status.indexes) : undefined}
          />
          <Row label="Exams" value={examsValue} detail={examsDetail} />
        </dl>
      )}

      <div className="flex items-center justify-between gap-2 pt-3 text-xs">
        <TextLink
          href="/developers/freshness"
          variant="subtle"
          className="text-muted-foreground"
          title={
            status?.updated ? `Data last changed ${status.updated}` : undefined
          }>
          {updated ?? "How fresh is the data?"}
        </TextLink>
        <TextLink
          href="/faq#current-semester"
          variant="subtle"
          className="text-muted-foreground">
          FAQ
        </TextLink>
      </div>
    </>
  )
}

/**
 * The semester pill in the navbar. Opens a small card saying what the data
 * covers, so "is this the right semester, are exams out yet" has an answer
 * without leaving the page.
 */
const SemesterStatus = () => (
  <Popover onOpenChange={(open) => open && track("semester_status_opened")}>
    <PopoverTrigger
      className="group text-muted-foreground hover:bg-accent data-[state=open]:bg-accent flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm whitespace-nowrap transition-colors"
      aria-label={`Data for ${LATEST_SEMESTER_LABEL}. Show what is covered`}>
      {LATEST_SEMESTER_LABEL_SHORT}
      <ChevronDown
        className="size-3 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        aria-hidden
      />
    </PopoverTrigger>

    <PopoverContent align="end" sideOffset={8} className="w-80 rounded-xl p-3">
      <StatusCard />
    </PopoverContent>
  </Popover>
)

export default SemesterStatus
