"use client"

import { useEffect, useState } from "react"
import { PlusIcon, TrashIcon } from "lucide-react"

import {
  CUSTOM_COURSE_COLORS,
  DEFAULT_CUSTOM_COURSE_COLOR
} from "@/lib/custom-course-colors"
import { STARS_TIMESLOTS } from "@/lib/constants"
import { formatHhmm } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useBoundState } from "@/state/bound.state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── constants ───────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" }
]

const TIME_OPTIONS = STARS_TIMESLOTS.filter(
  (t) => t.start >= 800 && t.start <= 2200
).map((t) => ({ value: t.start, label: formatHhmm(t.start) }))

const END_TIME_OPTIONS = STARS_TIMESLOTS.filter(
  (t) => t.end >= 830 && t.end <= 2300
).map((t) => ({ value: t.end, label: formatHhmm(t.end) }))

const SESSION_TYPES: { type: CustomCourseSessionType; label: string }[] = [
  { type: "LEC", label: "Lecture" },
  { type: "TUT", label: "Tutorial" },
  { type: "LAB", label: "Lab" }
]

// ─── form types ──────────────────────────────────────────────────────────────

interface SessionFormState {
  enabled: boolean
  day: number
  startTime: number
  endTime: number
  venue: string
}

interface FormState {
  name: string
  color: CustomCourseColor
  sessions: Record<CustomCourseSessionType, SessionFormState>
}

const DEFAULT_SESSION: SessionFormState = {
  enabled: false,
  day: 1,
  startTime: 900,
  endTime: 1000,
  venue: ""
}

const DEFAULT_FORM: FormState = {
  name: "",
  color: DEFAULT_CUSTOM_COURSE_COLOR,
  sessions: {
    LEC: { ...DEFAULT_SESSION, enabled: true },
    TUT: { ...DEFAULT_SESSION },
    LAB: { ...DEFAULT_SESSION }
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const courseToForm = (course: CustomCourse): FormState => {
  const sessions: FormState["sessions"] = {
    LEC: { ...DEFAULT_SESSION },
    TUT: { ...DEFAULT_SESSION },
    LAB: { ...DEFAULT_SESSION }
  }
  for (const s of course.sessions) {
    sessions[s.type] = {
      enabled: true,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      venue: s.venue
    }
  }
  // If nothing was enabled, fall back to LEC on
  const anyEnabled = Object.values(sessions).some((s) => s.enabled)
  if (!anyEnabled) sessions.LEC.enabled = true

  return { name: course.name, color: course.color, sessions }
}

const formToCourse = (
  form: FormState
): Omit<CustomCourse, "id"> => ({
  name: form.name.trim(),
  color: form.color,
  sessions: SESSION_TYPES.flatMap(({ type }) => {
    const s = form.sessions[type]
    if (!s.enabled) return []
    return [{ type, day: s.day, startTime: s.startTime, endTime: s.endTime, venue: s.venue }]
  })
})

// ─── session row ─────────────────────────────────────────────────────────────

const SELECT_CLS =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none"

interface SessionRowProps {
  label: string
  type: CustomCourseSessionType
  state: SessionFormState
  onChange: (updates: Partial<SessionFormState>) => void
}

const SessionRow = ({ label, type, state, onChange }: SessionRowProps) => {
  const validEndTimes = END_TIME_OPTIONS.filter((t) => t.value > state.startTime)

  const handleStartChange = (v: number) => {
    const updates: Partial<SessionFormState> = { startTime: v }
    if (state.endTime <= v) {
      const next = END_TIME_OPTIONS.find((t) => t.value > v)
      if (next) updates.endTime = next.value
    }
    onChange(updates)
  }

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="accent-primary h-4 w-4 rounded"
        />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{type}</span>
      </label>

      {state.enabled && (
        <div className="ml-6 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Day</Label>
            <select
              value={state.day}
              onChange={(e) => onChange({ day: Number(e.target.value) })}
              className={SELECT_CLS}>
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Venue (optional)</Label>
            <Input
              placeholder="e.g. LT2A"
              value={state.venue}
              onChange={(e) => onChange({ venue: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Start</Label>
            <select
              value={state.startTime}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              className={SELECT_CLS}>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">End</Label>
            <select
              value={state.endTime}
              onChange={(e) => onChange({ endTime: Number(e.target.value) })}
              className={SELECT_CLS}>
              {validEndTimes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── modal form ──────────────────────────────────────────────────────────────

interface CourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CustomCourse
  onSave: (data: Omit<CustomCourse, "id">) => void
}

const CourseModal = ({
  open,
  onOpenChange,
  initial,
  onSave
}: CourseModalProps) => {
  const [form, setForm] = useState<FormState>(
    initial ? courseToForm(initial) : DEFAULT_FORM
  )

  // Reset form when modal opens with new initial value
  useEffect(() => {
    if (open) setForm(initial ? courseToForm(initial) : DEFAULT_FORM)
  }, [open, initial])

  const setSession = (
    type: CustomCourseSessionType,
    updates: Partial<SessionFormState>
  ) =>
    setForm((f) => ({
      ...f,
      sessions: {
        ...f.sessions,
        [type]: { ...f.sessions[type], ...updates }
      }
    }))

  const anyEnabled = Object.values(form.sessions).some((s) => s.enabled)
  const isValid = form.name.trim().length > 0 && anyEnabled

  const handleSave = () => {
    onSave(formToCourse(form))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit custom course" : "Add custom course"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-name">Name</Label>
            <Input
              id="cc-name"
              placeholder="e.g. Gym, Lunch, CCA"
              value={form.name}
              maxLength={40}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Colour */}
          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex gap-2">
              {(Object.keys(CUSTOM_COURSE_COLORS) as CustomCourseColor[]).map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={CUSTOM_COURSE_COLORS[color].label}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform",
                      CUSTOM_COURSE_COLORS[color].swatch,
                      form.color === color
                        ? "scale-125 ring-2 ring-offset-2 ring-current"
                        : "hover:scale-110"
                    )}
                  />
                )
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="space-y-3">
            <Label>Sessions</Label>
            <div className="space-y-4">
              {SESSION_TYPES.map(({ type, label }) => (
                <SessionRow
                  key={type}
                  label={label}
                  type={type}
                  state={form.sessions[type]}
                  onChange={(updates) => setSession(type, updates)}
                />
              ))}
            </div>
            {!anyEnabled && (
              <p className="text-destructive text-xs">
                Enable at least one session.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!isValid} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── main editor ─────────────────────────────────────────────────────────────

const CustomCourseEditor = () => {
  const timetableIndex = useBoundState((s) => s.timetableIndex)
  const customCourses = useBoundState((s) => s.customCourses)
  const addCustomCourse = useBoundState((s) => s.addCustomCourse)
  const updateCustomCourse = useBoundState((s) => s.updateCustomCourse)
  const removeCustomCourse = useBoundState((s) => s.removeCustomCourse)

  const courses = customCourses[timetableIndex] ?? []

  const [addOpen, setAddOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CustomCourse | null>(null)

  useEffect(() => {
    setAddOpen(false)
    setEditingCourse(null)
  }, [timetableIndex])

  return (
    <div className="rounded-lg border-2">
      <div className="text-muted-foreground p-2 text-center text-xs">
        Custom Courses
      </div>

      <hr />

      <div className="max-h-[30vh] overflow-y-auto">
        {courses.map((course) => {
          const colorStyle = CUSTOM_COURSE_COLORS[course.color]
          const sessionLabels = course.sessions.map((s) => s.type).join(" · ")

          return (
            <div key={course.id}>
              <div
                className="hover:bg-accent cursor-pointer pr-1 pl-3 text-sm transition-colors"
                onClick={() => setEditingCourse(course)}>
                <div className="flex w-full items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                        colorStyle.swatch
                      )}
                    />
                    <span className="truncate max-w-[110px]">{course.name}</span>
                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                      {sessionLabels}
                    </span>
                  </div>

                  <div
                    className="flex size-8 flex-shrink-0 cursor-pointer items-center justify-center p-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCustomCourse(course.id)
                      if (editingCourse?.id === course.id)
                        setEditingCourse(null)
                    }}>
                    <TrashIcon className="text-muted-foreground hover:text-foreground size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {courses.length === 0 && (
        <div className="p-2">
          <p className="text-muted-foreground text-center text-sm">
            No custom courses yet
            <br />
            Add personal time blocks below
          </p>
        </div>
      )}

      <hr />

      <button
        className="hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-1.5 p-2 text-sm transition-colors"
        onClick={() => setAddOpen(true)}>
        <PlusIcon className="size-3.5" />
        Add custom course
      </button>

      {/* Add modal */}
      <CourseModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => addCustomCourse(data)}
      />

      {/* Edit modal */}
      <CourseModal
        open={!!editingCourse}
        onOpenChange={(open) => { if (!open) setEditingCourse(null) }}
        initial={editingCourse ?? undefined}
        onSave={(data) => {
          if (editingCourse) updateCustomCourse(editingCourse.id, data)
        }}
      />
    </div>
  )
}

export default CustomCourseEditor
