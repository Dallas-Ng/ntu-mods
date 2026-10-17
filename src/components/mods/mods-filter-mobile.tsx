"use client"

import { useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react"

import { TRUN_DAY_MAP } from "@/lib/constants"
import { parseFilterList } from "@/lib/filter-modules"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle
} from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"

import {
  ACTIVE,
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

type DrawerView = "all" | "types" | "schools"

/** Shared by the filter button, the pills and the drawer. */
export function useFilterDrawer() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<DrawerView>("all")
  return {
    open,
    view,
    setOpen,
    setView,
    openView: (next: DrawerView) => {
      setView(next)
      setOpen(true)
    }
  }
}

type FilterDrawer = ReturnType<typeof useFilterDrawer>

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
        <span className="bg-primary text-primary-foreground border-background absolute -top-1.5 -right-1.5 flex min-w-4.5 items-center justify-center rounded-full border-2 px-1 text-[10px] leading-4 font-semibold">
          {activeCount}
        </span>
      )}
    </Button>
  )
}

/** Mobile: the three filters people use most, each opening the drawer. */
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
      <Pill
        active={schools.length > 0}
        caret
        onClick={() => drawer.openView("schools")}>
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

/** One drawer for everything. School is a page inside it, not a second sheet. */
export const ModsFilterDrawer = ({
  drawer,
  ...props
}: ModsFilterProps & { drawer: FilterDrawer }) => {
  const f = useFilters(props)
  const { view } = drawer

  const schools = parseFilterList(props.moduleFaculty)
  const types = parseFilterList(props.moduleType)
  const levels = parseFilterList(props.moduleLevel)

  const toggle = (key: FacetKey, selected: string[], value: string) =>
    f.setParam(
      key,
      (selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
      ).join(",")
    )

  const title =
    view === "all" ? "Filters" : view === "types" ? "Type" : "School"
  const canReset =
    view === "all"
      ? f.activeCount > 0
      : view === "types"
        ? types.length > 0
        : schools.length > 0
  const reset = () =>
    view === "all"
      ? f.resetFilters()
      : f.setParam(view === "types" ? "moduleType" : "moduleFaculty", "all")

  const schoolSummary =
    schools.length === 0
      ? "Any"
      : schools.length <= 2
        ? schools.join(", ")
        : `${schools.length} selected`

  return (
    <Drawer open={drawer.open} onOpenChange={drawer.setOpen}>
      <DrawerContent className="max-h-[90svh] data-[vaul-drawer-direction=bottom]:max-h-[90svh]">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <DrawerDescription className="sr-only">
          Narrow the module list.
        </DrawerDescription>

        <div className="flex min-h-12 items-center justify-between px-4 pt-1">
          {view === "schools" ? (
            <button
              type="button"
              className="-ml-1 flex cursor-pointer items-center gap-1 text-lg font-semibold"
              onClick={() => drawer.setView("all")}>
              <ChevronLeft className="size-5" />
              School
            </button>
          ) : (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
          {canReset && (
            <button
              type="button"
              className="text-primary-alt cursor-pointer py-1.5 text-sm"
              onClick={reset}>
              {view === "all" ? "Reset" : "Clear"}
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-1 pb-3">
          {view === "types" && (
            <ChipRow>
              {TYPE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  on={types.includes(o.value)}
                  faded={props.countOption("moduleType", o.value) === 0}
                  onClick={() => toggle("moduleType", types, o.value)}>
                  {o.label}
                </Chip>
              ))}
            </ChipRow>
          )}

          {view === "schools" && (
            <FacetOptions
              facet="moduleFaculty"
              options={FACULTY_OPTIONS}
              selected={schools}
              countOption={props.countOption}
              onChange={(next) => f.setParam("moduleFaculty", next.join(","))}
              className="max-h-none [&_button]:py-3 [&_button]:text-base"
            />
          )}

          {view === "all" && (
            <>
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
                <div className="grid grid-cols-7 gap-1.5">
                  {LEVEL_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      square
                      on={levels.includes(o.value)}
                      faded={props.countOption("moduleLevel", o.value) === 0}
                      onClick={() => toggle("moduleLevel", levels, o.value)}>
                      {o.value}
                    </Chip>
                  ))}
                </div>
              </Group>

              <Group title="Type">
                <ChipRow>
                  {TYPE_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      on={types.includes(o.value)}
                      faded={props.countOption("moduleType", o.value) === 0}
                      onClick={() => toggle("moduleType", types, o.value)}>
                      {o.label}
                    </Chip>
                  ))}
                </ChipRow>
              </Group>

              <Group title="Class days">
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((d) => (
                    <Chip
                      key={d}
                      square
                      on={f.days.includes(d)}
                      onClick={() =>
                        f.setParam(
                          "moduleDay",
                          (f.days.includes(d)
                            ? f.days.filter((x) => x !== d)
                            : [...f.days, d].sort()
                          ).join(",")
                        )
                      }>
                      {TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP]}
                    </Chip>
                  ))}
                </div>
              </Group>

              <Group title="Class times">
                <div className="flex items-center gap-2 text-sm">
                  <TimeSelect
                    label=""
                    className="min-w-0 flex-1"
                    value={props.moduleTimeStart}
                    onChange={(v) => f.setParam("moduleTimeStart", v)}
                  />
                  <span className="text-muted-foreground">to</span>
                  <TimeSelect
                    label=""
                    className="min-w-0 flex-1"
                    value={props.moduleTimeEnd}
                    onChange={(v) => f.setParam("moduleTimeEnd", v)}
                  />
                </div>
              </Group>

              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between border-t pt-4 text-left text-base"
                onClick={() => drawer.setView("schools")}>
                School
                <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
                  <span className="max-w-40 truncate">{schoolSummary}</span>
                  <ChevronRight className="size-4 shrink-0" />
                </span>
              </button>
            </>
          )}
        </div>

        <div className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DrawerClose asChild>
            <Button className="h-11 w-full text-base">
              {props.resultCount === 0
                ? "No modules match"
                : `Show ${props.resultCount} module${props.resultCount === 1 ? "" : "s"}`}
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
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

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

function Chip({
  on,
  faded,
  square,
  onClick,
  children
}: {
  on: boolean
  faded?: boolean
  square?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        "cursor-pointer border text-sm transition-colors",
        square
          ? "h-10 min-w-0 rounded-lg px-0"
          : "h-9 min-w-12 rounded-full px-3.5",
        on
          ? "bg-foreground text-background border-transparent font-semibold"
          : "text-foreground hover:border-foreground",
        faded && !on && "opacity-40"
      )}
      onClick={onClick}>
      {children}
    </button>
  )
}
