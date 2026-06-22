"use client"

import { useEffect, useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"

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

const SESSION_TYPE_OPTIONS: { value: CustomCourseSessionType; label: string }[] =
  [
    { value: "LEC", label: "Lecture" },
    { value: "TUT", label: "Tutorial" },
    { value: "LAB", label: "Lab" }
  ]

const SELECT_CLS =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none"

// ─── form types ──────────────────────────────────────────────────────────────

interface SessionRow {
  _key: string // local react key only
  type: CustomCourseSessionType
  day: number
  startTime: number
  endTime: number
  venue: string
}

interface FormState {
  name: string
  color: CustomCourseColor
  sessions: SessionRow[]
}

const newSession = (
  defaults?: Partial<Omit<SessionRow, "_key">>
): SessionRow => ({
  _key: crypto.randomUUID(),
  type: "LEC",
  day: 1,
  startTime: 900,
  endTime: 1000,
  venue: "",
  ...defaults
})

const DEFAULT_FORM: FormState = {
  name: "",
  color: DEFAULT_CUSTOM_COURSE_COLOR,
  sessions: [newSession()]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const courseToForm = (course: CustomCourse): FormState => ({
  name: course.name,
  color: course.color,
  sessions:
    course.sessions.length > 0
      ? course.sessions.map((s) => ({ ...s, _key: crypto.randomUUID() }))
      : [newSession()]
})

const formToCourse = (form: FormState): Omit<CustomCourse, "id"> => ({
  name: form.name.trim(),
  color: form.color,
  sessions: form.sessions.map(({ _key: _, ...s }) => s)
})

// ─── session row component ────────────────────────────────────────────────────

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
  const validEndTimes = END_TIME_OPTIONS.filter(
    (t) => t.value > session.startTime
  )

  const handleStartChange = (v: number) => {
    const updates: Partial<SessionRow> = { startTime: v }
    if (session.endTime <= v) {
      const next = END_TIME_OPTIONS.find((t) => t.value > v)
      if (next) updates.endTime = next.value
    }
    onChange(updates)
  }

  return (
    <div className="bg-muted/40 rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <select
          value={session.type}
          onChange={(e) =>
            onChange({ type: e.target.value as CustomCourseSessionType })
          }
          className="border-input bg-background focus:ring-ring h-8 rounded-md border px-2 text-xs font-medium shadow-sm focus:ring-1 focus:outline-none">
          {SESSION_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors">
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Day</Label>
          <select
            value={session.day}
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
            value={session.venue}
            onChange={(e) => onChange({ venue: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Start</Label>
          <select
            value={session.startTime}
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
            value={session.endTime}
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
    </div>
  )
}

// ─── modal ───────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (open) setForm(initial ? courseToForm(initial) : DEFAULT_FORM)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSession = (key: string, updates: Partial<SessionRow>) =>
    setForm((f) => ({
      ...f,
      sessions: f.sessions.map((s) =>
        s._key === key ? { ...s, ...updates } : s
      )
    }))

  const removeSession = (key: string) =>
    setForm((f) => ({
      ...f,
      sessions: f.sessions.filter((s) => s._key !== key)
    }))

  const addSession = () =>
    setForm((f) => ({
      ...f,
      sessions: [...f.sessions, newSession()]
    }))

  const isValid = form.name.trim().length > 0 && form.sessions.length > 0

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
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
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
                      "relative h-6 w-6 rounded-full transition-opacity",
                      CUSTOM_COURSE_COLORS[color].swatch,
                      form.color !== color && "opacity-50 hover:opacity-80"
                    )}>
                    {form.color === color && (
                      <Check className="absolute inset-0 m-auto size-3.5 text-white drop-shadow" />
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="space-y-2">
            <Label>Sessions</Label>

            <div className="space-y-2">
              {form.sessions.map((session) => (
                <SessionRowEditor
                  key={session._key}
                  session={session}
                  canRemove={form.sessions.length > 1}
                  onChange={(updates) => setSession(session._key, updates)}
                  onRemove={() => removeSession(session._key)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addSession}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors">
              <Plus className="size-3.5" />
              Add session
            </button>
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
            <div
              key={course.id}
              className="hover:bg-accent cursor-pointer pr-1 pl-3 text-sm transition-colors"
              onClick={() => setEditingCourse(course)}>
              <div className="flex w-full items-center justify-between py-1">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      colorStyle.swatch
                    )}
                  />
                  <span className="max-w-[110px] truncate">{course.name}</span>
                  <span className="text-muted-foreground flex-shrink-0 text-xs">
                    {sessionLabels}
                  </span>
                </div>

                <div
                  className="flex size-8 flex-shrink-0 cursor-pointer items-center justify-center p-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCustomCourse(course.id)
                    if (editingCourse?.id === course.id) setEditingCourse(null)
                  }}>
                  <Trash2 className="text-muted-foreground hover:text-foreground size-3.5" />
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
        <Plus className="size-3.5" />
        Add custom course
      </button>

      <CourseModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => addCustomCourse(data)}
      />

      <CourseModal
        open={!!editingCourse}
        onOpenChange={(open) => {
          if (!open) setEditingCourse(null)
        }}
        initial={editingCourse ?? undefined}
        onSave={(data) => {
          if (editingCourse) updateCustomCourse(editingCourse.id, data)
        }}
      />
    </div>
  )
}

export default CustomCourseEditor
