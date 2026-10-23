"use client"

import { useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react"

import { parseFilterList } from "@/lib/filter-modules"
import { TRUN_DAY_MAP } from "@/lib/module-constants"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerNestedRoot,
  DrawerTitle
} from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"

import {
  ACTIVE,
  ChipGroup,
  DAYS,
  FacetOptions,
  FACULTY_OPTIONS,
  LEVEL_OPTIONS,
  TimeSelect,
  TYPE_OPTIONS,
  useFilters,
  type FacetKey,
  type ModsFilterProps,
  type Option
} from "./mods-filter-shared"

type DrawerView = "all" | "types"

/** Shared by the filter button, the pills and the drawers. */
export function useFilterDrawer() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<DrawerView>("all")
  const [schoolOpen, setSchoolOpen] = useState(false)
  return {
    open,
    view,
    schoolOpen,
    setOpen,
    setSchoolOpen,
    openView: (next: DrawerView) => {
      setView(next)
      setOpen(true)
    },
    /** From the pill the filters drawer is closed, so School opens on its
     * own. From inside the filters drawer it nests on top of it. */
    openSchool: () => setSchoolOpen(true)
  }
}

type FilterDrawer = ReturnType<typeof useFilterDrawer>

const DRAWER_CLASS =
  "max-h-[90svh] data-[vaul-drawer-direction=bottom]:max-h-[90svh]"
/** The School list is long, so cap it well below full height. */
const SCHOOL_DRAWER_CLASS =
  "max-h-[65svh] data-[vaul-drawer-direction=bottom]:max-h-[65svh]"

/** Sits next to the search box. The only place active filters are counted. */
export const ModsFilterButton = ({
  drawer,
  ...props
}: ModsFilterProps & { drawer: FilterDrawer }) => {
  const { activeCount } = useFilters(props)

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="All filters"
      className="relative h-9 w-9 shrink-0 md:hidden"
      onClick={() => drawer.openView("all")}>
      <SlidersHorizontal className="size-4" />
      {activeCount > 0 && (
        <span className="bg-primary text-primary-foreground border-background absolute -top-1.5 -right-1.5 flex min-w-4.5 items-center justify-center rounded-full border-2 px-1 text-xs leading-4 font-semibold">
          {activeCount}
        </span>
      )}
    </Button>
  )
}

/** Mobile: the three filters people use most. */
export const ModsFilterPills = ({
  drawer,
  ...props
}: ModsFilterProps & { drawer: FilterDrawer }) => {
  const f = useFilters(props)
  const schools = parseFilterList(props.moduleFaculty)
  const types = parseFilterList(props.moduleType)

  const label = (name: string, selected: string[], options: Option[]) => {
    if (selected.length === 0) return name
    if (selected.length === 1)
      return `${name}: ${options.find((o) => o.value === selected[0])?.label.split(" · ")[0] ?? selected[0]}`
    return `${name}: ${selected.length}`
  }

  return (
    <div className="flex flex-wrap gap-2 md:hidden">
      <Pill active={schools.length > 0} caret onClick={drawer.openSchool}>
        {label("School", schools, FACULTY_OPTIONS)}
      </Pill>
      <Pill
        active={types.length > 0}
        caret
        onClick={() => drawer.openView("types")}>
        {label("Type", types, TYPE_OPTIONS)}
      </Pill>
      {/* On by default, so it reads as a quiet default and only turns solid
          when someone switches it off to see every semester. */}
      <Pill
        active={!f.semesterOnly}
        pressed={f.semesterOnly}
        onClick={() =>
          f.setParam("currentOnly", f.semesterOnly ? "false" : "true", "true")
        }>
        {f.semesterOnly ? (
          <>
            <Check className="size-3.5" />
            This semester
          </>
        ) : (
          "All semesters"
        )}
      </Pill>
    </div>
  )
}

function Pill({
  active,
  pressed,
  caret,
  onClick,
  children
}: {
  active: boolean
  pressed?: boolean
  caret?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={pressed}
      className={cn(
        "h-8 max-w-full min-w-0 gap-1.5 rounded-full px-3",
        active && ACTIVE
      )}
      onClick={onClick}>
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        {children}
      </span>
      {caret && <ChevronDown className="size-3 shrink-0 opacity-60" />}
    </Button>
  )
}

function DrawerHead({
  title,
  onReset,
  resetLabel = "Reset"
}: {
  title: string
  onReset?: () => void
  resetLabel?: string
}) {
  return (
    <div className="flex min-h-12 items-center justify-between px-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {onReset && (
        <button
          type="button"
          className="text-primary-alt cursor-pointer py-1.5 text-sm"
          onClick={onReset}>
          {resetLabel}
        </button>
      )}
    </div>
  )
}

function ShowResults({ count, label }: { count: number; label?: string }) {
  return (
    <div className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerClose asChild>
        <Button className="h-11 w-full text-base">
          {label ??
            (count === 0
              ? "No modules match"
              : `Show ${count} module${count === 1 ? "" : "s"}`)}
        </Button>
      </DrawerClose>
    </div>
  )
}

/** The School list. Shared by the standalone and the nested drawer. */
function SchoolContent({
  nested,
  ...props
}: ModsFilterProps & { nested: boolean }) {
  const f = useFilters(props)
  const schools = parseFilterList(props.moduleFaculty)

  return (
    <DrawerContent className={SCHOOL_DRAWER_CLASS}>
      <DrawerTitle className="sr-only">School</DrawerTitle>
      <DrawerDescription className="sr-only">
        Choose one or more schools.
      </DrawerDescription>
      <DrawerHead
        title="School"
        resetLabel="Clear"
        onReset={
          schools.length > 0
            ? () => f.setParam("moduleFaculty", "all")
            : undefined
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <FacetOptions
          facet="moduleFaculty"
          options={FACULTY_OPTIONS}
          selected={schools}
          countOption={props.countOption}
          onChange={(next) => f.setParam("moduleFaculty", next.join(","))}
          className="max-h-none [&_label]:py-3 [&_label]:text-base"
        />
      </div>
      <ShowResults
        count={props.resultCount}
        label={nested ? "Done" : undefined}
      />
    </DrawerContent>
  )
}

/**
 * The filters drawer, with School as a second drawer nested on top of it.
 * Opened from the School pill, School is a standalone drawer instead.
 */
export const ModsFilterDrawer = ({
  drawer,
  ...props
}: ModsFilterProps & { drawer: FilterDrawer }) => {
  const f = useFilters(props)

  const schools = parseFilterList(props.moduleFaculty)
  const types = parseFilterList(props.moduleType)
  const levels = parseFilterList(props.moduleLevel)

  const schoolSummary =
    schools.length === 0
      ? "Any"
      : schools.length <= 2
        ? schools.join(", ")
        : `${schools.length} selected`

  const typeChips = TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
    faded: props.countOption("moduleType", o.value) === 0
  }))

  return (
    <>
      <Drawer open={drawer.open} onOpenChange={drawer.setOpen}>
        <DrawerContent className={DRAWER_CLASS}>
          <DrawerTitle className="sr-only">
            {drawer.view === "all" ? "Filters" : "Type"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Narrow the module list.
          </DrawerDescription>

          {drawer.view === "types" ? (
            <>
              <DrawerHead
                title="Type"
                resetLabel="Clear"
                onReset={
                  types.length > 0
                    ? () => f.setParam("moduleType", "all")
                    : undefined
                }
              />
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-3">
                <ChipGroup
                  value={types}
                  options={typeChips}
                  onValueChange={(next) =>
                    f.setParam("moduleType", next.join(","))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <DrawerHead
                title="Filters"
                onReset={f.activeCount > 0 ? f.resetFilters : undefined}
              />
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-1 pb-3">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-base">This semester only</span>
                    <span className="text-muted-foreground block text-xs">
                      Hide modules not offered this semester
                    </span>
                  </span>
                  <Switch
                    checked={f.semesterOnly}
                    onCheckedChange={(on) =>
                      f.setParam("currentOnly", on ? "true" : "false", "true")
                    }
                  />
                </label>

                <Group title="Level" hint="×1000">
                  <ChipGroup
                    layout="grid"
                    value={levels}
                    options={LEVEL_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.value,
                      faded:
                        props.countOption(
                          "moduleLevel" as FacetKey,
                          o.value
                        ) === 0
                    }))}
                    onValueChange={(next) =>
                      f.setParam("moduleLevel", next.join(","))
                    }
                  />
                </Group>

                <Group title="Type">
                  <ChipGroup
                    value={types}
                    options={typeChips}
                    onValueChange={(next) =>
                      f.setParam("moduleType", next.join(","))
                    }
                  />
                </Group>

                <Group title="Class days">
                  <ChipGroup
                    layout="grid"
                    value={f.days.map(String)}
                    options={DAYS.map((d) => ({
                      value: String(d),
                      label: TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP]
                    }))}
                    onValueChange={(next) =>
                      f.setParam("moduleDay", next.map(Number).sort().join(","))
                    }
                  />
                </Group>

                <Group title="Class times">
                  <div className="flex items-center gap-2 text-sm">
                    <TimeSelect
                      ariaLabel="Earliest start time"
                      className="min-w-0 flex-1"
                      triggerClassName="data-[size=sm]:h-10"
                      value={props.moduleTimeStart}
                      onChange={(v) => f.setParam("moduleTimeStart", v)}
                    />
                    <span className="text-muted-foreground">to</span>
                    <TimeSelect
                      ariaLabel="Latest end time"
                      className="min-w-0 flex-1"
                      triggerClassName="data-[size=sm]:h-10"
                      value={props.moduleTimeEnd}
                      onChange={(v) => f.setParam("moduleTimeEnd", v)}
                    />
                  </div>
                </Group>

                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between border-t pt-4 text-left text-base"
                  onClick={() => drawer.setSchoolOpen(true)}>
                  School
                  <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
                    <span className="max-w-40 truncate">{schoolSummary}</span>
                    <ChevronRight className="size-4 shrink-0" />
                  </span>
                </button>
              </div>
            </>
          )}

          <ShowResults count={props.resultCount} />

          {/* Nested so vaul stacks it on this drawer and scales this one back. */}
          <DrawerNestedRoot
            open={drawer.schoolOpen && drawer.open}
            onOpenChange={drawer.setSchoolOpen}>
            <SchoolContent nested {...props} />
          </DrawerNestedRoot>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={drawer.schoolOpen && !drawer.open}
        onOpenChange={drawer.setSchoolOpen}>
        <SchoolContent nested={false} {...props} />
      </Drawer>
    </>
  )
}

function Group({
  title,
  hint,
  children
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-2.5 flex justify-between text-sm">
        <span>{title}</span>
        {hint && <span className="text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
