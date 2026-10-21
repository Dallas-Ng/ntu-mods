"use client"

import { useCallback, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import {
  InfoIcon,
  LockIcon,
  LockOpenIcon,
  RotateCcwIcon,
  Settings2Icon,
  WandIcon,
  XIcon
} from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { track } from "@/lib/analytics"
import { COURSE_TYPE } from "@/lib/constants"
import { customCourseModuleKey } from "@/lib/custom-course-colors"
import { formatHhmm } from "@/lib/format"
import {
  CONSECUTIVE_OPTIONS,
  GAP_OPTIONS,
  GENERATION_INDEX_TYPES,
  isDefaultGenerationConfig,
  TIME_OPTIONS
} from "@/lib/generation-config"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableGeneration } from "@/hooks/use-timetable-generation"
import { Button } from "@/components/ui/button"
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

import TimetableBlacklistEditor from "./timetable-blacklist-editor"
import TimetableResultsCycler from "./timetable-results-cycler"

const ElevatedDialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay className="z-50" />
    <DialogPrimitive.Content
      className={cn(
        "bg-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 outline-none sm:rounded-lg",
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
  const { indexes: seasonIndexes } = useSeasonIndexes(
    latestYear,
    latestSemester
  )
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
                  const globallyRelaxed = config.skippableTypes.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={
                        globallyRelaxed
                          ? undefined
                          : () => toggleType(moduleKey, type)
                      }
                      disabled={globallyRelaxed}
                      title={
                        globallyRelaxed ? "Already relaxed globally" : undefined
                      }
                      className={`focus-visible:ring-ring/50 h-6 rounded border px-2 text-xs font-medium transition-[color,background-color,border-color,opacity] outline-none focus-visible:ring-[3px] ${
                        globallyRelaxed
                          ? "cursor-not-allowed opacity-50"
                          : active
                            ? "bg-foreground text-background cursor-pointer border-transparent"
                            : "text-muted-foreground hover:border-foreground cursor-pointer"
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

const LockedModulesSection = () => {
  const { timetable } = useTimetable()
  const { customCourses } = useCustomCourses()
  const lockedModules = useBoundState((s) => s.lockedModules)
  const toggleModuleLock = useBoundState((s) => s.toggleModuleLock)

  const moduleKeys = Object.keys(timetable)

  // Custom blocks with more than one option are schedulable too, so they get
  // the same lock treatment as modules.
  const customRows = customCourses
    .filter((course) => course.indexes.length > 1)
    .map((course) => {
      const selected =
        course.indexes.find((i) => i.id === course.selectedIndexId) ??
        course.indexes[0]
      return {
        key: customCourseModuleKey(course.id),
        label: course.name,
        indexLabel: selected?.label ?? "—"
      }
    })

  const rows = [
    ...moduleKeys.map((moduleKey) => ({
      key: moduleKey,
      label: moduleKey,
      indexLabel: timetable[moduleKey] ?? "—"
    })),
    ...customRows
  ]

  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel tip="Locked entries always keep their current index. The generator won't try other options for them. Useful when a module's index is pre-assigned by the school.">
        Locked modules
      </SectionLabel>
      <div className="flex flex-col gap-2">
        {rows.map(({ key, label, indexLabel }) => {
          const isLocked = lockedModules.includes(key)
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-muted-foreground w-20 shrink-0 truncate text-xs font-medium">
                {label}
              </span>
              <button
                onClick={() => toggleModuleLock(key)}
                className={`focus-visible:ring-ring/50 flex h-6 cursor-pointer items-center gap-1.5 rounded border px-2 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] ${
                  isLocked
                    ? "bg-foreground text-background border-transparent"
                    : "text-muted-foreground hover:border-foreground"
                }`}>
                {isLocked ? (
                  <LockIcon className="size-3" />
                ) : (
                  <LockOpenIcon className="size-3" />
                )}
                {indexLabel}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SettingsForm = ({
  uniqueOnly,
  onUniqueChange
}: {
  uniqueOnly: boolean
  onUniqueChange: (value: boolean) => void
}) => {
  const [blockOpen, setBlockOpen] = useState(false)
  const config = useBoundState((s) => s.generationConfig)
  const updateConfig = useBoundState((s) => s.updateGenerationConfig)
  const resetConfig = useBoundState((s) => s.resetGenerationConfig)
  const lockedModules = useBoundState((s) => s.lockedModules)

  const isPristine =
    isDefaultGenerationConfig(config) &&
    lockedModules.length === 0 &&
    uniqueOnly

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
                className={`focus-visible:ring-ring/50 flex h-8 flex-1 cursor-pointer items-center justify-center rounded-md border text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] ${
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

      <UniqueOnlyToggle checked={uniqueOnly} onChange={onUniqueChange} />

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
                className={`focus-visible:ring-ring/50 h-7 cursor-pointer rounded-md border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] ${
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

      {/* Per-module index locking */}
      <LockedModulesSection />

      {/* Blacklist */}
      <div className="flex flex-col gap-2">
        <SectionLabel tip="Click or drag to mark specific day/time slots as unavailable. No classes will be scheduled during blocked slots.">
          Block time slots
        </SectionLabel>
        <button
          onClick={() => setBlockOpen(true)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-[3px]">
          <span>
            {config.blacklistedTimeslots.length > 0
              ? `${config.blacklistedTimeslots.length} slot${config.blacklistedTimeslots.length !== 1 ? "s" : ""} blocked`
              : "No slots blocked"}
          </span>
          <span className="text-muted-foreground/60">Edit</span>
        </button>
      </div>

      {/* Reset */}
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-muted-foreground text-xs">
          Restores every setting above, including blocked slots and index locks
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={isPristine}
          onClick={() => {
            resetConfig()
            if (!uniqueOnly) onUniqueChange(true)
            track("timetable_generation_settings_reset", {
              locked_modules: lockedModules.length,
              blacklisted_slots: config.blacklistedTimeslots.length
            })
          }}
          className="h-7 shrink-0 gap-1.5 text-xs">
          <RotateCcwIcon className="size-3" />
          Reset
        </Button>
      </div>

      <ResponsiveModal
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title="Block time slots"
        description="Times the generator must keep free."
        className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-md">
        <TimetableBlacklistEditor />
      </ResponsiveModal>
    </div>
  )
}

const ConfigSummary = () => {
  const config = useBoundState((s) => s.generationConfig)
  const lockedModules = useBoundState((s) => s.lockedModules)
  const { timetable } = useTimetable()
  const { customCourses } = useCustomCourses()
  const moduleKeys = [
    ...Object.keys(timetable),
    ...customCourses.map((c) => customCourseModuleKey(c.id))
  ]

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

  const lockedCount = lockedModules.filter((m) => moduleKeys.includes(m)).length
  if (lockedCount > 0) {
    chips.push(`Locked: ${lockedCount} mod${lockedCount !== 1 ? "s" : ""}`)
  }

  if (customCourses.length > 0) {
    chips.push(
      `${customCourses.length} custom block${customCourses.length !== 1 ? "s" : ""} avoided`
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

const UniqueOnlyToggle = ({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) => (
  <div className="flex items-center justify-between gap-3">
    <SectionLabel tip="Skip options that place classes in exactly the same slots and differ only by index number, so all 60 results are layouts you haven't seen.">
      Unique layouts only
    </SectionLabel>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      aria-label="Unique layouts only"
    />
  </div>
)

const TimetableGenerationConfig = () => {
  const [open, setOpen] = useState(false)
  const { timetable } = useTimetable()
  const generationConfig = useBoundState((s) => s.generationConfig)
  const uniqueTimeslotsOnly = useBoundState((s) => s.uniqueTimeslotsOnly)
  const setUniqueTimeslotsOnly = useBoundState((s) => s.setUniqueTimeslotsOnly)
  const {
    combinations,
    currentIdx,
    isGenerating,
    isDiagnosing,
    truncated,
    duplicatesSkipped,
    hasGenerated,
    suggestions,
    generate,
    navigateTo,
    saveToPlan
  } = useTimetableGeneration()

  const noModules = Object.keys(timetable).length === 0

  /**
   * Uniqueness is a search setting, not a display filter — flipping it has to
   * re-run generation, otherwise the result budget stays spent on look-alikes.
   */
  const handleUniqueChange = useCallback(
    (value: boolean) => {
      setUniqueTimeslotsOnly(value)
      if (hasGenerated) generate(generationConfig, undefined, value)
      track("timetable_generation_unique_toggled", {
        unique_only: value,
        regenerated: hasGenerated
      })
    },
    [setUniqueTimeslotsOnly, hasGenerated, generate, generationConfig]
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Settings trigger */}
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-[3px]">
        <div className="flex items-center gap-1.5">
          <Settings2Icon className="size-3.5" />
          <span>Generation Settings</span>
        </div>
        <span className="text-muted-foreground/60 text-xs">Edit</span>
      </button>

      {/* Settings summary chips */}
      <ConfigSummary />

      {/* A dialog on desktop, a nested drawer on phones. */}
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Generation Settings"
        description="Preferences used when generating timetables."
        className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-lg">
        <SettingsForm
          uniqueOnly={uniqueTimeslotsOnly}
          onUniqueChange={handleUniqueChange}
        />
      </ResponsiveModal>

      {noModules ? null : (
        <>
          <Button
            onClick={() => {
              generate()
              track("timetable_generation_started", {
                module_count: Object.keys(timetable).length,
                unique_only: uniqueTimeslotsOnly,
                load_preference: generationConfig.loadPreference,
                blacklisted_slots: generationConfig.blacklistedTimeslots.length,
                free_days_count: generationConfig.preferredFreeDays.length,
                max_consecutive_slots: generationConfig.maxConsecutiveSlots,
                min_gap: generationConfig.minGapBetweenClasses,
                day_start: generationConfig.dayStartTime,
                day_end: generationConfig.dayEndTime
              })
            }}
            disabled={isGenerating}
            className="w-full gap-2">
            <WandIcon className="size-4" />
            {isGenerating ? "Generating…" : "Generate Timetable"}
          </Button>
        </>
      )}

      {hasGenerated && combinations.length === 0 && !isGenerating && (
        <div className="flex flex-col gap-1.5 text-center">
          <p className="text-muted-foreground text-xs">
            No valid combinations found.
          </p>
          {isDiagnosing && (
            <p className="text-muted-foreground text-xs">
              Analyzing constraints…
            </p>
          )}
          {!isDiagnosing && suggestions.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs">Try:</p>
              <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
                {suggestions.map((s) => (
                  <li key={s.label}>· {s.label}</li>
                ))}
              </ul>
            </div>
          )}
          {!isDiagnosing && suggestions.length === 0 && (
            <p className="text-muted-foreground text-xs">
              No single constraint change would help — try relaxing multiple
              settings.
            </p>
          )}
        </div>
      )}

      {combinations.length > 0 && (
        <TimetableResultsCycler
          combinations={combinations}
          currentIndex={currentIdx}
          onNavigate={navigateTo}
          onSaveToPlan={saveToPlan}
          truncated={truncated}
          uniqueTimeslotsOnly={uniqueTimeslotsOnly}
          duplicatesSkipped={duplicatesSkipped}
        />
      )}
    </div>
  )
}

export default TimetableGenerationConfig
