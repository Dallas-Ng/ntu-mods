"use client"

import { useEffect, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import {
  Calendar,
  Copy,
  Download,
  ImageDown,
  Link as LinkIcon,
  MousePointerClick,
  Palette,
  PanelRight,
  Settings2,
  Wrench,
  X
} from "lucide-react"
import { toast } from "sonner"

import { reportError, track } from "@/lib/analytics"
import { customCoursesToIcsInputs } from "@/lib/custom-course-to-index"
import { getIcs } from "@/lib/get-ics"
import { planHasData } from "@/lib/plan-name"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useAllModules } from "@/hooks/use-all-modules"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useHydrated } from "@/hooks/use-hydrated"
import { usePlanNames } from "@/hooks/use-plan-names"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import { cardVariants } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import AppearanceSettings from "@/components/settings/appearance-settings"

import TimetableCalendarDialog from "./timetable-calendar-dialog"
import TimetableImportDialog from "./timetable-import-dialog"
import TimetableSettingsDialog from "./timetable-settings-dialog"
import TimetableShareDialog from "./timetable-share-dialog"

interface Props {
  indexPickerEnabled: boolean
  onToggleIndexPicker: () => void
}

const useOpenedTracker = (dialog: string, open: boolean) => {
  useEffect(() => {
    if (open) track("timetable_dialog_opened", { dialog })
  }, [dialog, open])
}

const TimetableActionsDropdown = ({
  indexPickerEnabled,
  onToggleIndexPicker
}: Props) => {
  const { timetable, timetables, timetableIndex, duplicateTimetable } =
    useTimetable()
  const { customCourses } = useCustomCourses()
  const year = latestYear
  const semester = latestSemester
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const { settings, updateSettings } = useSettings()
  const hydrated = useHydrated()
  const { label, named } = usePlanNames()
  const moduleRemarks = useBoundState((s) => s.moduleRemarks)
  const indexRemarks = useBoundState((s) => s.indexRemarks)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useOpenedTracker("share", shareOpen)
  useOpenedTracker("import", importOpen)
  useOpenedTracker("settings", settingsOpen)
  useOpenedTracker("appearance", appearanceOpen)

  // Open the first time; after that the student's last choice is kept.
  // Saved settings from before this one existed have no value yet.
  const open = settings.timetableToolbarOpen ?? true
  const setOpen = (next: boolean) =>
    updateSettings({ timetableToolbarOpen: next })

  // The Calendar tool explains the file first; the download happens from there.
  const openCalendar = () => {
    if (Object.keys(timetable).length === 0 && customCourses.length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }
    setCalendarOpen(true)
  }

  const handleDownloadCalendar = async () => {
    if (Object.keys(timetable).length === 0 && customCourses.length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }

    setCalendarLoading(true)

    try {
      const indexLookup: Record<string, Index[]> = {}
      for (const [moduleCode, indexKey] of Object.entries(timetable)) {
        const slots = seasonIndexes[moduleCode]?.[indexKey]
        if (slots) indexLookup[indexKey] = slots
      }

      const titleLookup: Record<string, string> = {}
      for (const m of modules) {
        if (timetable[m.code]) titleLookup[m.code] = m.title
      }

      // Merge in custom blocks (gym, CCA, etc.)
      const customIcs = customCoursesToIcsInputs(customCourses)
      Object.assign(indexLookup, customIcs.indexLookup)
      Object.assign(titleLookup, customIcs.titleLookup)

      const icsText = getIcs(
        { ...timetable, ...customIcs.timetable },
        indexLookup,
        titleLookup,
        settings.tableCell,
        customIcs.labelLookup,
        moduleRemarks,
        indexRemarks
      )

      if (!icsText) throw new Error("Failed to generate calendar")

      const blob = new Blob([icsText], { type: "text/calendar" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "ntu_mods_timetable.ics"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      track("calendar_downloaded", {
        module_count: Object.keys(timetable).length
      })
    } catch (e) {
      reportError("calendar_download", e)
      toast.error("Something went wrong, please try again later")
    }

    setCalendarLoading(false)
  }

  // Duplicating onto a plan that has data asks first.
  const [confirmTarget, setConfirmTarget] = useState<number | null>(null)
  // Phones: the tools live in a bottom drawer instead of sliding out.
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetView, setSheetView] = useState<"tools" | "duplicate">("tools")
  const allCustomCourses = useBoundState((s) => s.customCourses)

  const requestDuplicate = (toIndex: number) => {
    if (planHasData(timetables, allCustomCourses, toIndex))
      setConfirmTarget(toIndex)
    else handleDuplicate(toIndex)
  }

  const handleDuplicate = (toIndex: number) => {
    duplicateTimetable(timetableIndex, toIndex)
    track("timetable_plan_duplicated", {
      from_plan: timetableIndex + 1,
      to_plan: toIndex + 1
    })
    toast(`Duplicated to ${label(toIndex)}`)
  }

  const tool = (
    label: string,
    hint: string,
    icon: React.ReactNode,
    button: (child: React.ReactNode) => React.ReactNode
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>{button(icon)}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-48 text-center">
        <p className="font-medium">{label}</p>
        <p className="text-xs opacity-80">{hint}</p>
      </TooltipContent>
    </Tooltip>
  )

  const iconButton = (
    label: string,
    props: React.ComponentProps<typeof Button> = {}
  ) => (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      {...props}
      className={cn("size-8", props.className)}
    />
  )

  // What the phone drawer lists: icon, title and a one-line description.
  const closeThen = (fn: () => void) => () => {
    setSheetOpen(false)
    // Let the drawer finish closing before a dialog opens over it.
    window.setTimeout(fn, 200)
  }
  const mobileTools: {
    title: string
    hint: string
    icon: typeof Copy
    onClick?: () => void
    href?: string
    disabled?: boolean
    active?: boolean
  }[] = [
    {
      title: indexPickerEnabled ? "Stop picking indexes" : "Pick indexes",
      hint: "Tap a class to try its other indexes.",
      icon: MousePointerClick,
      active: indexPickerEnabled,
      onClick: () => {
        setSheetOpen(false)
        onToggleIndexPicker()
      }
    },
    {
      title: "Import",
      hint: "Add modules from pasted text.",
      icon: Download,
      onClick: closeThen(() => setImportOpen(true))
    },
    {
      title: "Duplicate",
      hint: "Copy this plan into another plan.",
      icon: Copy,
      onClick: () => setSheetView("duplicate")
    },
    {
      title: "Share",
      hint: "Get a link to this timetable.",
      icon: LinkIcon,
      onClick: closeThen(() => setShareOpen(true))
    },
    {
      title: "Calendar",
      hint: "Download an .ics file for your calendar app.",
      icon: Calendar,
      disabled: calendarLoading,
      onClick: closeThen(openCalendar)
    },
    {
      title: "Export image",
      hint: "Save it as a wallpaper or picture.",
      icon: ImageDown,
      href: "/screenshot"
    },
    {
      title: "Appearance",
      hint: "Switch theme and change the colours of your classes.",
      icon: Palette,
      onClick: closeThen(() => setAppearanceOpen(true))
    },
    {
      title: "Table settings",
      hint: "Change how the timetable grid looks.",
      icon: Settings2,
      onClick: closeThen(() => setSettingsOpen(true))
    }
  ]

  // Whether this is a phone is only known after hydration: until then hold
  // the toolbar's place so nothing can be tapped while it changes shape.
  if (!hydrated)
    return <Skeleton className="ml-auto size-8 md:h-8 md:w-[22rem]" />

  return (
    <>
      <TimetableShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        timetable={timetable}
        customCourses={customCourses}
      />
      <TimetableImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ResponsiveModal
        open={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        nested={false}
        title="Appearance"
        showDescription
        description="Theme, radius, density, contrast and the colours of your classes."
        className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <div
          className={cn(
            cardVariants(),
            "rounded-xl p-2 sm:rounded-2xl sm:p-5"
          )}>
          <AppearanceSettings compact />
        </div>
      </ResponsiveModal>
      <TimetableCalendarDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        loading={calendarLoading}
        onDownload={handleDownloadCalendar}
      />
      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={`Overwrite ${confirmTarget !== null ? label(confirmTarget) : ""}?`}
        description={`${confirmTarget !== null ? label(confirmTarget) : ""} already has a timetable. Duplicating ${label(timetableIndex)} into it replaces what is there.`}
        confirmLabel="Overwrite"
        destructive
        onConfirm={() => {
          if (confirmTarget !== null) handleDuplicate(confirmTarget)
        }}
      />
      <TimetableSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {settings.isMobile ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8 gap-1.5"
            onClick={() => {
              setSheetView("tools")
              setSheetOpen(true)
            }}>
            <Wrench className="size-4" />
            Tools
          </Button>

          <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
            <DrawerContent className="p-2">
              <DrawerTitle className="px-3 text-left text-base font-semibold">
                {sheetView === "tools" ? "Tools" : "Duplicate to plan"}
              </DrawerTitle>
              <DrawerDescription className="text-muted-foreground px-3 pb-2 text-left text-sm">
                {sheetView === "tools"
                  ? "Work on this plan, or take it with you."
                  : "Pick the plan to copy this one into."}
              </DrawerDescription>

              <div className="max-h-[70svh] space-y-0.5 overflow-y-auto px-1 pb-6">
                {sheetView === "tools"
                  ? mobileTools.map((t) => {
                      const Row = t.href ? "a" : "button"
                      return (
                        <Row
                          key={t.title}
                          {...(t.href ? { href: t.href } : { type: "button" })}
                          disabled={t.disabled}
                          onClick={t.onClick}
                          className={cn(
                            "hover:bg-accent flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-colors disabled:opacity-50",
                            t.active && "bg-primary-subtle"
                          )}>
                          <span
                            className={cn(
                              "bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg",
                              t.active && "bg-primary-subtle text-primary"
                            )}>
                            <t.icon className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {t.title}
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {t.hint}
                            </span>
                          </span>
                        </Row>
                      )
                    })
                  : timetables.map((_, index) =>
                      index === timetableIndex ? null : (
                        <button
                          key={index}
                          type="button"
                          onClick={closeThen(() => requestDuplicate(index))}
                          className="hover:bg-accent flex w-full items-center justify-between gap-4 rounded-lg p-3 text-left text-sm transition-colors">
                          <span className="truncate">{label(index)}</span>
                          {named(index) && (
                            <span className="text-muted-foreground shrink-0 text-xs">
                              Plan {index + 1}
                            </span>
                          )}
                        </button>
                      )
                    )}
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <div className="contents">
          {/* Tools sit against the trigger, everyday ones first, rarer ones
            after the divider. Clipped, not resized, so nothing shifts while
            it sweeps out to the left. Under sm there is no room, so it
            covers the row. */}
          <TooltipProvider delayDuration={150}>
            <div
              inert={!open}
              className={cn(
                "bg-card ml-auto flex min-w-0 items-center gap-1 transition-[clip-path,opacity] motion-reduce:transition-none max-sm:absolute max-sm:inset-y-0 max-sm:right-10 max-sm:left-0 max-sm:z-20",
                open
                  ? "ease-out-strong opacity-100 duration-[280ms] [clip-path:inset(-8px_0_-8px_0)]"
                  : "pointer-events-none opacity-0 duration-[380ms] ease-[cubic-bezier(0.65,0,0.35,1)] [clip-path:inset(-8px_0_-8px_100%)]"
              )}>
              {/* Working on the plan, most used first. */}
              <div className="flex items-center gap-0.5">
                {tool(
                  "Pick indexes",
                  "Tap a class to try its other indexes.",
                  <MousePointerClick className="size-4" />,
                  (icon) =>
                    iconButton(
                      indexPickerEnabled
                        ? "Stop picking indexes"
                        : "Pick indexes",
                      {
                        children: icon,
                        onClick: onToggleIndexPicker,
                        className: indexPickerEnabled
                          ? "bg-primary-subtle text-primary hover:bg-accent hover:text-primary"
                          : undefined
                      }
                    )
                )}
                {tool(
                  "Import",
                  "Add modules from pasted text.",
                  <Download className="size-4" />,
                  (icon) =>
                    iconButton("Import from text", {
                      children: icon,
                      onClick: () => setImportOpen(true)
                    })
                )}
                <DropdownMenu>
                  {tool(
                    "Duplicate",
                    "Copy this plan into another plan.",
                    <Copy className="size-4" />,
                    (icon) => (
                      <DropdownMenuTrigger asChild>
                        {iconButton("Duplicate to plan", { children: icon })}
                      </DropdownMenuTrigger>
                    )
                  )}
                  <DropdownMenuContent align="end">
                    {timetables.map((_, index) =>
                      index === timetableIndex ? null : (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => requestDuplicate(index)}
                          className="justify-between gap-4">
                          <span className="truncate">{label(index)}</span>
                          {named(index) && (
                            <span className="text-muted-foreground shrink-0 text-xs">
                              Plan {index + 1}
                            </span>
                          )}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <span className="bg-border mx-1 h-4 w-px" />
              {/* Getting the plan out. */}
              <div className="flex items-center gap-0.5">
                {tool(
                  "Share",
                  "Get a link to this timetable.",
                  <LinkIcon className="size-4" />,
                  (icon) =>
                    iconButton("Share", {
                      children: icon,
                      onClick: () => setShareOpen(true)
                    })
                )}
                {tool(
                  "Calendar",
                  "Download an .ics file for your calendar app.",
                  <Calendar className="size-4" />,
                  (icon) =>
                    iconButton("Save to calendar", {
                      children: icon,
                      onClick: openCalendar,
                      disabled: calendarLoading
                    })
                )}
                {tool(
                  "Export image",
                  "Save it as a wallpaper or picture.",
                  <ImageDown className="size-4" />,
                  (icon) => (
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Export as image">
                      <a href="/screenshot">{icon}</a>
                    </Button>
                  )
                )}
              </div>
              <span className="bg-border mx-1 h-4 w-px" />
              {/* How the page looks: changed rarely, so nearest the trigger. */}
              <div className="flex items-center gap-0.5">
                {/* The icon is the panel on the right, and turns a quarter to
                  put it below. Phones always use the drawer. */}
                <div className="flex items-center max-md:hidden">
                  {(() => {
                    const below = settings.timetableLayout === "below"
                    const next = below ? "side" : "below"
                    const label = below ? "Panel on the right" : "Panel below"
                    const hint = below
                      ? "Put the panel beside the grid."
                      : "Lay the panel out under the grid."
                    return tool(
                      label,
                      hint,
                      <PanelRight
                        className={cn(
                          "ease-out-strong size-4 transition-transform duration-300 motion-reduce:transition-none",
                          below && "rotate-90"
                        )}
                      />,
                      (icon) =>
                        iconButton(label, {
                          children: icon,
                          onClick: () => {
                            updateSettings({ timetableLayout: next })
                            track("timetable_layout_changed", { layout: next })
                          }
                        })
                    )
                  })()}
                </div>
                {tool(
                  "Table settings",
                  "Change how the timetable grid looks.",
                  <Settings2 className="size-4" />,
                  (icon) =>
                    iconButton("Table settings", {
                      children: icon,
                      onClick: () => setSettingsOpen(true)
                    })
                )}
                {tool(
                  "Appearance",
                  "Switch theme and change the colours of your classes.",
                  <Palette className="size-4" />,
                  (icon) =>
                    iconButton("Appearance", {
                      children: icon,
                      onClick: () => setAppearanceOpen(true)
                    })
                )}
              </div>
            </div>
          </TooltipProvider>

          {indexPickerEnabled && (
            <span className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 text-center text-xs lg:block">
              Tap a block to see its other indexes
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={cn(
              "relative size-8 max-sm:ml-auto",
              open && "bg-accent"
            )}>
            <Wrench
              className={cn(
                "ease-out-strong absolute size-4 transition-all duration-150 motion-reduce:transition-none",
                open ? "scale-50 rotate-90 opacity-0" : "scale-100 opacity-100"
              )}
            />
            <X
              className={cn(
                "ease-out-strong absolute size-4 transition-all duration-150 motion-reduce:transition-none",
                open ? "scale-100 opacity-100" : "scale-50 -rotate-90 opacity-0"
              )}
            />
            <span className="sr-only">
              {open ? "Close tools" : "Open tools"}
            </span>
          </Button>
        </div>
      )}
    </>
  )
}

export default TimetableActionsDropdown
