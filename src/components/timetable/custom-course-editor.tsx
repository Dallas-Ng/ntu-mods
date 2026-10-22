"use client"

import { useEffect, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Plus, Trash2, X } from "lucide-react"

import { track } from "@/lib/analytics"
import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/module-constants"
import { CUSTOM_LUNCH_TYPE } from "@/lib/custom-course-colors"
import { formatHhmm } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

// ─── constants ───────────────────────────────────────────────────────────────

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const

const TIME_OPTIONS = STARS_TIMESLOTS.filter(
  (t) => t.start >= 800 && t.start <= 2200
).map((t) => ({ value: String(t.start), label: formatHhmm(t.start) }))

const END_TIME_OPTIONS = STARS_TIMESLOTS.filter(
  (t) => t.end >= 830 && t.end <= 2300
).map((t) => ({ value: String(t.end), label: formatHhmm(t.end) }))

const PRESET_TYPES = [
  { value: "LEC", label: "Lecture" },
  { value: "TUT", label: "Tutorial" },
  { value: "LAB", label: "Lab" },
  { value: "SEM", label: "Seminar" },
  { value: "DES", label: "Design" },
  { value: "PRJ", label: "Project" },
  { value: CUSTOM_LUNCH_TYPE, label: "Lunch" }
]

const PRESET_TYPE_VALUES = new Set(PRESET_TYPES.map((p) => p.value))
const CUSTOM_SENTINEL = "__custom__"
const MAX_INDEXES = 10

// ─── form types ──────────────────────────────────────────────────────────────

interface SessionRow {
  _key: string
  type: string // stored value — preset code or free text; "" until chosen
  custom: boolean // "Custom…" picked, so `type` is free text (may stay empty)
  days: number[] // one persisted session is created per selected day
  startTime: number
  endTime: number
  venue: string
}

interface IndexRow {
  _key: string // doubles as the persisted CustomCourseIndex id
  label: string
  sessions: SessionRow[]
}

interface FormState {
  name: string
  indexes: IndexRow[]
  activeIndexKey: string
}

const newSession = (
  defaults?: Partial<Omit<SessionRow, "_key">>
): SessionRow => ({
  _key: crypto.randomUUID(),
  type: "",
  custom: false,
  days: [1],
  startTime: 900,
  endTime: 1000,
  venue: "",
  ...defaults
})

const newIndex = (label: string, sessions?: SessionRow[]): IndexRow => ({
  _key: crypto.randomUUID(),
  label,
  sessions: sessions ?? [newSession()]
})

const makeDefaultForm = (name = ""): FormState => {
  const index = newIndex("Option 1")
  return { name, indexes: [index], activeIndexKey: index._key }
}

// Persisted sessions are one-day-each; group siblings that only differ by
// day back into a single multi-day row for editing.
const groupSessionsIntoRows = (
  sessions: CustomCourseSession[]
): SessionRow[] => {
  const rows = new Map<string, SessionRow>()
  sessions.forEach((s) => {
    const groupKey = `${s.type}|${s.startTime}|${s.endTime}|${s.venue}`
    const existing = rows.get(groupKey)
    if (existing) {
      existing.days.push(s.day)
    } else {
      rows.set(groupKey, {
        _key: crypto.randomUUID(),
        type: s.type,
        custom: !PRESET_TYPE_VALUES.has(s.type),
        days: [s.day],
        startTime: s.startTime,
        endTime: s.endTime,
        venue: s.venue
      })
    }
  })
  return Array.from(rows.values())
}

const courseToForm = (course: CustomCourse): FormState => {
  const indexes: IndexRow[] =
    course.indexes?.length > 0
      ? course.indexes.map((i) => ({
          _key: i.id,
          label: i.label,
          sessions:
            i.sessions.length > 0
              ? groupSessionsIntoRows(i.sessions)
              : [newSession()]
        }))
      : [newIndex("Option 1")]

  const activeIndexKey =
    indexes.find((i) => i._key === course.selectedIndexId)?._key ??
    indexes[0]._key

  return { name: course.name, indexes, activeIndexKey }
}

const formToCourse = (form: FormState): Omit<CustomCourse, "id"> => {
  const indexes = form.indexes
    .map((index, i) => ({
      id: index._key,
      label: index.label.trim() || `Option ${i + 1}`,
      sessions: index.sessions.flatMap(({ _key: _k, custom: _c, days, ...s }) =>
        days.map((day) => ({ ...s, type: s.type.trim(), day }))
      )
    }))
    .filter((index) => index.sessions.length > 0)

  const selectedIndexId =
    indexes.find((i) => i.id === form.activeIndexKey)?.id ??
    indexes[0]?.id ??
    ""

  return { name: form.name.trim(), indexes, selectedIndexId }
}

// ─── session row ─────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: SessionRow
  canRemove: boolean
  onChange: (updates: Partial<SessionRow>) => void
  onRemove: () => void
}

const SessionRowEditor = ({
  session,
  canRemove,
  onChange,
  onRemove
}: SessionRowProps) => {
  const isCustomType = session.custom
  const selectValue = isCustomType ? CUSTOM_SENTINEL : session.type

  const validEndTimes = END_TIME_OPTIONS.filter(
    (t) => Number(t.value) > session.startTime
  )

  const toggleDay = (day: number) => {
    const has = session.days.includes(day)
    if (has && session.days.length === 1) return // keep at least one day
    onChange({
      days: has
        ? session.days.filter((d) => d !== day)
        : [...session.days, day].sort((a, b) => a - b)
    })
  }

  const handleStartChange = (v: string) => {
    const n = Number(v)
    const updates: Partial<SessionRow> = { startTime: n }
    if (session.endTime <= n) {
      const next = END_TIME_OPTIONS.find((t) => Number(t.value) > n)
      if (next) updates.endTime = Number(next.value)
    }
    onChange(updates)
  }

  const handleTypeSelectChange = (v: string) => {
    if (v === CUSTOM_SENTINEL) {
      onChange({ type: "", custom: true })
    } else {
      onChange({ type: v, custom: false })
    }
  }

  return (
    <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
      {/* Type selector + remove */}
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1.5">
          {/* Stacked full-width on mobile — a custom type input squeezed
              beside a select is cramped on a narrow dialog. Side-by-side
              from sm: up where there's room. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectValue} onValueChange={handleTypeSelectChange}>
              <SelectTrigger size="sm" className="w-full sm:w-36 sm:shrink-0">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_TYPES.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="pr-2 data-[state=checked]:font-medium *:[span]:last:w-full *:[span]:last:justify-between [&>[data-slot=select-item-indicator]]:hidden">
                    <span>{o.label}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      {o.value}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_SENTINEL}>
                  <span className="text-muted-foreground">Custom…</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {isCustomType && (
              <Input
                className="h-8 w-full text-sm placeholder:text-sm"
                placeholder="Optional — e.g. Practice, Shift, Meeting"
                value={session.type}
                maxLength={20}
                onChange={(e) => onChange({ type: e.target.value })}
              />
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive mt-0.5 size-8 shrink-0">
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Days */}
      <div className="space-y-1">
        <Label className="text-xs">Days</Label>
        <div className="flex flex-wrap gap-1">
          {DAYS.map((day) => {
            const active = session.days.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={active}
                className={cn(
                  "focus-visible:ring-ring/50 h-6 cursor-pointer rounded border px-2 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]",
                  active
                    ? "bg-foreground text-background border-transparent"
                    : "text-muted-foreground hover:border-foreground"
                )}>
                {TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Venue */}
      <div className="space-y-1">
        <Label className="text-xs">Venue</Label>
        <Input
          className="h-8 text-sm placeholder:text-sm"
          placeholder="Optional"
          value={session.venue}
          onChange={(e) => onChange({ venue: e.target.value })}
        />
      </div>

      {/* Start + End */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Start</Label>
          <Select
            value={String(session.startTime)}
            onValueChange={handleStartChange}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">End</Label>
          <Select
            value={String(session.endTime)}
            onValueChange={(v) => onChange({ endTime: Number(v) })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {validEndTimes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── modal ───────────────────────────────────────────────────────────────────

export interface CourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CustomCourse
  initialName?: string
  onSave: (data: Omit<CustomCourse, "id">) => void
}

export const CourseModal = ({
  open,
  onOpenChange,
  initial,
  initialName,
  onSave
}: CourseModalProps) => {
  const [form, setForm] = useState<FormState>(
    initial ? courseToForm(initial) : makeDefaultForm(initialName)
  )

  useEffect(() => {
    if (open)
      setForm(initial ? courseToForm(initial) : makeDefaultForm(initialName))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeIndex =
    form.indexes.find((i) => i._key === form.activeIndexKey) ?? form.indexes[0]

  const updateActiveIndex = (updates: Partial<Omit<IndexRow, "_key">>) =>
    setForm((f) => ({
      ...f,
      indexes: f.indexes.map((i) =>
        i._key === activeIndex._key ? { ...i, ...updates } : i
      )
    }))

  const updateSession = (key: string, updates: Partial<SessionRow>) =>
    updateActiveIndex({
      sessions: activeIndex.sessions.map((s) =>
        s._key === key ? { ...s, ...updates } : s
      )
    })

  const removeSession = (key: string) =>
    updateActiveIndex({
      sessions: activeIndex.sessions.filter((s) => s._key !== key)
    })

  const addSession = () =>
    updateActiveIndex({ sessions: [...activeIndex.sessions, newSession()] })

  const addIndex = () =>
    setForm((f) => {
      if (f.indexes.length >= MAX_INDEXES) return f
      // Seed from the option on screen — most alternatives are small tweaks
      const seed = f.indexes.find((i) => i._key === f.activeIndexKey)
      const created = newIndex(
        `Option ${f.indexes.length + 1}`,
        seed?.sessions.map((s) => ({ ...s, _key: crypto.randomUUID() }))
      )
      return {
        ...f,
        indexes: [...f.indexes, created],
        activeIndexKey: created._key
      }
    })

  const removeIndex = (key: string) =>
    setForm((f) => {
      if (f.indexes.length <= 1) return f
      const indexes = f.indexes.filter((i) => i._key !== key)
      return {
        ...f,
        indexes,
        activeIndexKey:
          f.activeIndexKey === key ? indexes[0]._key : f.activeIndexKey
      }
    })

  const isValid =
    form.name.trim().length > 0 &&
    form.indexes.length > 0 &&
    form.indexes.every(
      (index) =>
        index.sessions.length > 0 &&
        index.sessions.every(
          (s) => s.days.length > 0 && (s.custom || s.type !== "")
        )
    )

  const hasMultipleIndexes = form.indexes.length > 1

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit custom block" : "Add custom block"}
      description="Name the block, then choose its days, times and venue."
      className="max-h-[90vh] overflow-y-auto">
      <div className="space-y-5 pt-1">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="cc-name">
            Name{" "}
            <span className="text-muted-foreground font-normal">
              (shown like a module code)
            </span>
          </Label>
          <Input
            id="cc-name"
            placeholder="e.g. Gym, Badminton CCA, Part-time Job"
            value={form.name}
            maxLength={40}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        {/* Options (indexes) */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label>Options</Label>
            <span className="text-muted-foreground text-xs">
              Generation picks whichever fits best
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {form.indexes.map((index) => {
              const isActive = index._key === activeIndex._key
              return (
                <div
                  key={index._key}
                  className={cn(
                    "flex h-7 items-center rounded-md border text-xs font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background border-transparent"
                      : "text-muted-foreground hover:border-foreground"
                  )}>
                  <button
                    type="button"
                    className="h-full cursor-pointer px-2.5"
                    onClick={() =>
                      setForm((f) => ({ ...f, activeIndexKey: index._key }))
                    }>
                    {index.label.trim() || "Untitled"}
                  </button>
                  {hasMultipleIndexes && (
                    <button
                      type="button"
                      aria-label={`Remove ${index.label}`}
                      className="h-full cursor-pointer pr-1.5 opacity-60 hover:opacity-100"
                      onClick={() => removeIndex(index._key)}>
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              )
            })}

            {form.indexes.length < MAX_INDEXES && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addIndex}
                className="text-muted-foreground h-7 gap-1 px-2 text-xs">
                <Plus className="size-3.5" />
                Option
              </Button>
            )}
          </div>

          {hasMultipleIndexes && (
            <Input
              className="h-8 text-sm placeholder:text-sm"
              placeholder="Option name"
              value={activeIndex.label}
              maxLength={30}
              onChange={(e) => updateActiveIndex({ label: e.target.value })}
            />
          )}
        </div>

        {/* Sessions of the active option */}
        <div className="space-y-2">
          <Label>Sessions</Label>

          <div className="space-y-2">
            {activeIndex.sessions.map((session) => (
              <SessionRowEditor
                key={session._key}
                session={session}
                canRemove={activeIndex.sessions.length > 1}
                onChange={(updates) => updateSession(session._key, updates)}
                onRemove={() => removeSession(session._key)}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={addSession}
            className="text-muted-foreground h-8 gap-1.5">
            <Plus className="size-3.5" />
            Add session
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!isValid}
            onClick={() => {
              onSave(formToCourse(form))
              onOpenChange(false)
            }}>
            Save
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

// ─── sidebar panel ───────────────────────────────────────────────────────────

const CustomCourseEditor = () => {
  const timetableIndex = useBoundState((s) => s.timetableIndex)
  const customCourses = useBoundState((s) => s.customCourses)
  const addCustomCourse = useBoundState((s) => s.addCustomCourse)
  const updateCustomCourse = useBoundState((s) => s.updateCustomCourse)
  const removeCustomCourse = useBoundState((s) => s.removeCustomCourse)
  const selectCustomCourseIndex = useBoundState(
    (s) => s.selectCustomCourseIndex
  )

  const courses = customCourses[timetableIndex] ?? []

  const [addOpen, setAddOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CustomCourse | null>(null)

  useEffect(() => {
    setAddOpen(false)
    setEditingCourse(null)
  }, [timetableIndex])

  return (
    <div>
      <div className="max-h-[30vh] overflow-y-auto">
        {courses.map((course) => {
          const selected =
            course.indexes.find((i) => i.id === course.selectedIndexId) ??
            course.indexes[0]
          // Collapse repeats from multi-day sessions (e.g. 5x "LEC") into "LEC ×5"
          const typeCounts = new Map<string, number>()
          selected?.sessions.forEach((s) =>
            typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1)
          )
          const sessionLabels = [...typeCounts]
            .map(([type, count]) => {
              const label = type.length > 0 ? type : ""
              if (count === 1) return label
              return label ? `${label} (${count}d)` : `${count}d`
            })
            .join(" · ")

          return (
            <div key={course.id}>
              <div
                className="hover:bg-accent flex cursor-pointer items-center justify-between pr-3 pl-4 text-sm transition-colors"
                onClick={() => setEditingCourse(course)}>
                <div className="flex min-w-0 items-center gap-1">
                  <span className="max-w-[110px] min-w-16 truncate font-medium">
                    {course.name}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-sm">
                    {sessionLabels}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${course.name}`}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCustomCourse(course.id)
                    if (editingCourse?.id === course.id) setEditingCourse(null)
                    track("custom_course_deleted")
                  }}>
                  <Trash2 className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
                </button>
              </div>

              {course.indexes.length > 1 && (
                <div className="flex flex-wrap gap-1 px-4 pb-1">
                  {course.indexes.map((courseIndex) => {
                    const isActive = courseIndex.id === selected?.id
                    return (
                      <button
                        key={courseIndex.id}
                        type="button"
                        onClick={() =>
                          selectCustomCourseIndex(course.id, courseIndex.id)
                        }
                        className={cn(
                          "focus-visible:ring-ring/50 h-5 cursor-pointer rounded border px-1.5 text-[0.65rem] font-medium transition-colors outline-none focus-visible:ring-[3px]",
                          isActive
                            ? "bg-foreground text-background border-transparent"
                            : "text-muted-foreground hover:border-foreground"
                        )}>
                        {courseIndex.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        className="hover:bg-accent focus-visible:ring-ring/50 mx-4 mt-1 flex w-[calc(100%-2rem)] cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed p-2 text-sm transition-colors outline-none focus-visible:ring-[3px]"
        onClick={() => setAddOpen(true)}>
        <Plus className="size-3.5" />
        Add custom block
      </button>

      <CourseModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => {
          addCustomCourse(data)
          const selected =
            data.indexes.find((i) => i.id === data.selectedIndexId) ??
            data.indexes[0]
          track("custom_course_created", {
            name_length: data.name.length,
            index_count: data.indexes.length,
            session_count: selected?.sessions.length ?? 0,
            days: [...new Set(selected?.sessions.map((s) => s.day) ?? [])],
            types: [...new Set(selected?.sessions.map((s) => s.type) ?? [])]
          })
        }}
      />

      <CourseModal
        open={!!editingCourse}
        onOpenChange={(open) => {
          if (!open) setEditingCourse(null)
        }}
        initial={editingCourse ?? undefined}
        onSave={(data) => {
          if (editingCourse) {
            track("custom_course_edited", {
              index_count_delta:
                data.indexes.length - editingCourse.indexes.length
            })
            updateCustomCourse(editingCourse.id, data)
          }
        }}
      />
    </div>
  )
}

export default CustomCourseEditor
