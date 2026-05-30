"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { XIcon, InfoIcon, Settings2Icon, WandIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import posthog from "posthog-js"

import { COURSE_TYPE, TRUN_DAY_MAP } from "@/lib/constants"
import { formatHhmm } from "@/lib/format"
import {
  CONSECUTIVE_OPTIONS,
  GAP_OPTIONS,
  GENERATION_INDEX_TYPES,
  TIME_OPTIONS
} from "@/lib/generation-config"
import { cn } from "@/lib/utils"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableGeneration } from "@/hooks/use-timetable-generation"
import { latestSemester, latestYear } from "@/lib/semesters"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

import TimetableBlacklistEditor from "./timetable-blacklist-editor"
import TimetableLunchEditor from "./timetable-lunch-editor"
import TimetableResultsCycler from "./timetable-results-cycler"

const ElevatedDialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay className="z-[60]" />
    <DialogPrimitive.Content
      className={cn(
        "bg-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[60] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 outline-none sm:rounded-lg",
        className
      )}
      {...props}>
      {children}
      <DialogPrimitive.Close className="ring-offset-background focus:ring-ring absolute top-2 right-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
        <XIcon />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
)

const SectionLabel = ({
  children,
  tip
}: {
  children: React.ReactNode
  tip?: string
}) => (
  <TooltipProvider delayDuration={200}>
    <div className="flex items-center gap-1">
      <span className="text-foreground text-xs font-medium">{children}</span>
      {tip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="text-muted-foreground/60 hover:text-muted-foreground size-3 cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-52 text-xs">
            {tip}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  </TooltipProvider>
)

const CollisionIgnoreSection = () => {
  const { timetable } = useTimetable()
  const { indexes: seasonIndexes } = useSeasonIndexes(latestYear, latestSemester)
  const config = useBoundState((s) => s.generationConfig)
  const updateConfig = useBoundState((s) => s.updateGenerationConfig)

  const moduleKeys = Object.keys(timetable)
  if (moduleKeys.length === 0) return null

  const toggleType = (moduleKey: string, type: IndexType) => {
    const current = config.collisionIgnoreTypes?.[moduleKey] ?? []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    updateConfig({
      collisionIgnoreTypes: {
        ...config.collisionIgnoreTypes,
        [moduleKey]: updated
      }
    })
  }

  const rows = moduleKeys
    .map((moduleKey) => {
      const moduleIndexes = seasonIndexes[moduleKey]
      if (!moduleIndexes) return null
      const types = [
        ...new Set(
          Object.values(moduleIndexes).flatMap((slots) =>
            slots.map((s) => s.type)
          )
        )
      ] as IndexType[]
      return { moduleKey, types }
    })
    .filter(Boolean) as { moduleKey: string; types: IndexType[] }[]

  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel tip="Slots of the selected types won't block other classes and won't be blocked by them. Useful for online lectures where you can watch the recording later.">
        Allow collisions per module
      </SectionLabel>
      <div className="flex flex-col gap-2">
        {rows.map(({ moduleKey, types }) => {
          const ignored = config.collisionIgnoreTypes?.[moduleKey] ?? []
          return (
            <div key={moduleKey} className="flex items-center gap-2">
              <span className="text-muted-foreground w-20 shrink-0 text-xs font-medium">
                {moduleKey}
              </span>
              <div className="flex flex-wrap gap-1">
                {types.map((type) => {
                  const active = ignored.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(moduleKey, type)}
                      className={`h-6 rounded border px-2 text-xs font-medium transition-colors ${
                        active
                          ? "bg-foreground text-background border-transparent"
                          : "text-muted-foreground hover:border-foreground"
                      }`}>
                      {COURSE_TYPE[type as keyof typeof COURSE_TYPE]}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SettingsForm = () => {
  const [blockOpen, setBlockOpen] = useState(false)
  const config = useBoundState((s) => s.generationConfig)
  const updateConfig = useBoundState((s) => s.updateGenerationConfig)

  const toggleSkippable = (type: IndexType) => {
    const current = config.skippableTypes
    updateConfig({
      skippableTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type]
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Day hours + Schedule style */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <SectionLabel tip="Only schedule classes within this time window. Classes outside these hours will be excluded.">
            Day hours
          </SectionLabel>
          <div className="flex items-center gap-1.5">
            <Select
              value={String(config.dayStartTime)}
              onValueChange={(v) => updateConfig({ dayStartTime: Number(v) })}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-xs">–</span>
            <Select
              value={String(config.dayEndTime)}
              onValueChange={(v) => updateConfig({ dayEndTime: Number(v) })}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.filter((t) => t.value > config.dayStartTime).map(
                  (t) => (
                    <SelectItem key={t.value} value={String(t.value)}>
                      {t.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel tip="Spread: classes distributed across more days with lighter daily loads. Compact: pack classes into fewer days so you get full days off.">
            Schedule style
          </SectionLabel>
          <div className="flex gap-1.5">
            {(["spread", "compact"] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => updateConfig({ loadPreference: pref })}
                className={`flex h-8 flex-1 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                  config.loadPreference === pref
                    ? "bg-foreground text-background border-transparent"
                    : "text-muted-foreground hover:border-foreground"
                }`}>
                {pref === "spread" ? "Spread" : "Compact"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Max consecutive + Min gap */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <SectionLabel tip="Maximum duration of classes scheduled back-to-back without a break. e.g. '2 hours' means at most 4 consecutive 30-min slots before a gap is required.">
            Max back-to-back
          </SectionLabel>
          <Select
            value={String(config.maxConsecutiveSlots)}
            onValueChange={(v) =>
              updateConfig({ maxConsecutiveSlots: Number(v) })
            }>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONSECUTIVE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel tip="Minimum gap required between any two consecutive classes on the same day. Useful if you need travel time between venues.">
            Min break
          </SectionLabel>
          <Select
            value={String(config.minGapBetweenClasses)}
            onValueChange={(v) =>
              updateConfig({ minGapBetweenClasses: Number(v) })
            }>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GAP_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lunch breaks */}
      <div className="flex flex-col gap-2">
        <SectionLabel tip="Block a lunch window per day. Classes will not be scheduled during these times. Toggle each day on to set its window.">
          Lunch breaks
        </SectionLabel>
        <TimetableLunchEditor />
      </div>

      {/* Skippable types */}
      <div className="flex flex-col gap-2">
        <SectionLabel tip="Selected class types will ignore day/time constraints. Useful for classes like lectures that you have no control over scheduling.">
          Relax constraints for
        </SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {GENERATION_INDEX_TYPES.map((type) => {
            const active = config.skippableTypes.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleSkippable(type)}
                className={`h-7 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background border-transparent"
                    : "text-muted-foreground hover:border-foreground"
                }`}>
                {COURSE_TYPE[type as keyof typeof COURSE_TYPE]}
              </button>
            )
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Selected types ignore day/time constraints
        </p>
      </div>

      {/* Per-module collision ignore */}
      <CollisionIgnoreSection />

      {/* Blacklist */}
      <div className="flex flex-col gap-2">
        <SectionLabel tip="Click or drag to mark specific day/time slots as unavailable. No classes will be scheduled during blocked slots.">
          Block time slots
        </SectionLabel>
        <button
          onClick={() => setBlockOpen(true)}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors">
          <span>
            {config.blacklistedTimeslots.length > 0
              ? `${config.blacklistedTimeslots.length} slot${config.blacklistedTimeslots.length !== 1 ? "s" : ""} blocked`
              : "No slots blocked"}
          </span>
          <span className="text-muted-foreground/60">Edit</span>
        </button>
      </div>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <ElevatedDialogContent
          className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto sm:max-h-[85vh] sm:max-w-md"
          aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Block time slots</DialogTitle>
          </DialogHeader>
          <TimetableBlacklistEditor />
        </ElevatedDialogContent>
      </Dialog>
    </div>
  )
}

const ConfigSummary = () => {
  const config = useBoundState((s) => s.generationConfig)

  const chips: string[] = [
    `${formatHhmm(config.dayStartTime)}–${formatHhmm(config.dayEndTime)}`
  ]

  const consecLabel = CONSECUTIVE_OPTIONS.find(
    (o) => o.value === config.maxConsecutiveSlots
  )?.label
  if (config.maxConsecutiveSlots > 0 && consecLabel) {
    chips.push(`≤${consecLabel} back-to-back`)
  }

  if (config.minGapBetweenClasses > 0) {
    const gapLabel = GAP_OPTIONS.find(
      (o) => o.value === config.minGapBetweenClasses
    )?.label
    if (gapLabel) chips.push(`${gapLabel} break`)
  }

  if (config.lunchBreaks.length > 0) {
    const dayLabels = config.lunchBreaks
      .map((lb) => TRUN_DAY_MAP[lb.day as keyof typeof TRUN_DAY_MAP])
      .join(", ")
    chips.push(`Lunch: ${dayLabels}`)
  }

  chips.push(config.loadPreference === "compact" ? "Compact" : "Spread out")

  if (config.skippableTypes.length > 0) {
    chips.push(`Skip: ${config.skippableTypes.join(", ")}`)
  }

  if (config.blacklistedTimeslots.length > 0) {
    chips.push(
      `${config.blacklistedTimeslots.length} blocked slot${config.blacklistedTimeslots.length !== 1 ? "s" : ""}`
    )
  }

  const collisionIgnoreCount = Object.values(
    config.collisionIgnoreTypes ?? {}
  ).filter((types) => types.length > 0).length
  if (collisionIgnoreCount > 0) {
    chips.push(
      `Collisions allowed: ${collisionIgnoreCount} mod${collisionIgnoreCount !== 1 ? "s" : ""}`
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip}
          className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">
          {chip}
        </span>
      ))}
    </div>
  )
}

const TimetableGenerationConfig = () => {
  const [open, setOpen] = useState(false)
  const { timetable } = useTimetable()
  const generationConfig = useBoundState((s) => s.generationConfig)
  const {
    combinations,
    currentIdx,
    isGenerating,
    truncated,
    hasGenerated,
    generate,
    navigateTo,
    saveToPlan
  } = useTimetableGeneration()

  const noModules = Object.keys(timetable).length === 0

  return (
    <div className="flex flex-col gap-3">
      {/* Settings trigger */}
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors">
        <div className="flex items-center gap-1.5">
          <Settings2Icon className="size-3.5" />
          <span>Generation Settings</span>
        </div>
        <span className="text-muted-foreground/60 text-xs">Edit</span>
      </button>

      {/* Settings summary chips */}
      <ConfigSummary />

      {/* Settings modal — always Dialog (centered popup, not drawer) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <ElevatedDialogContent
          className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto sm:max-h-[85vh] sm:max-w-lg"
          aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Generation Settings</DialogTitle>
          </DialogHeader>
          <SettingsForm />
        </ElevatedDialogContent>
      </Dialog>

      {noModules ? (
        <p className="text-muted-foreground text-center text-xs">
          Add modules above before generating
        </p>
      ) : (
        <Button
          onClick={() => {
            generate()
            posthog.capture("timetable_generation_started", {
              module_count: Object.keys(timetable).length,
              load_preference: generationConfig.loadPreference,
              blacklisted_slots: generationConfig.blacklistedTimeslots.length,
              lunch_break_days: generationConfig.lunchBreaks.length
            })
          }}
          disabled={isGenerating}
          className="w-full gap-2">
          <WandIcon className="size-4" />
          {isGenerating ? "Generating…" : "Generate Timetable"}
        </Button>
      )}

      {hasGenerated && combinations.length === 0 && !isGenerating && (
        <p className="text-muted-foreground text-center text-xs">
          No valid combinations found. Try relaxing your constraints.
        </p>
      )}

      {combinations.length > 0 && (
        <TimetableResultsCycler
          combinations={combinations}
          currentIndex={currentIdx}
          onNavigate={navigateTo}
          onSaveToPlan={saveToPlan}
          truncated={truncated}
        />
      )}
    </div>
  )
}

export default TimetableGenerationConfig
