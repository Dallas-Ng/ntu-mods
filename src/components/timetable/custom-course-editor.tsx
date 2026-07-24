"use client"

import { useEffect, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Plus, Trash2 } from "lucide-react"
import posthog from "posthog-js"

import { STARS_TIMESLOTS } from "@/lib/constants"
import { formatHhmm } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

// ─── constants ───────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" }
]

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
  { value: "PRJ", label: "Project" }
]

const PRESET_TYPE_VALUES = new Set(PRESET_TYPES.map((p) => p.value))
const CUSTOM_SENTINEL = "__custom__"

// ─── form types ──────────────────────────────────────────────────────────────

interface SessionRow {
  _key: string
  type: string // stored value — preset code or free text
  day: number
  startTime: number
  endTime: number
  venue: string
}

interface FormState {
  name: string
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

const makeDefaultForm = (name = ""): FormState => ({
  name,
  sessions: [newSession()]
})

const courseToForm = (course: CustomCourse): FormState => ({
  name: course.name,
  sessions:
    course.sessions.length > 0
      ? course.sessions.map((s) => ({ ...s, _key: crypto.randomUUID() }))
      : [newSession()]
})

const formToCourse = (form: FormState): Omit<CustomCourse, "id"> => ({
  name: form.name.trim(),
  sessions: form.sessions
    .map(({ _key: _k, ...s }) => ({ ...s, type: s.type.trim() }))
    .filter((s) => s.type.length > 0)
})

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
  const isCustomType = !PRESET_TYPE_VALUES.has(session.type)
  const selectValue = isCustomType ? CUSTOM_SENTINEL : session.type

  const validEndTimes = END_TIME_OPTIONS.filter(
    (t) => Number(t.value) > session.startTime
  )

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
      onChange({ type: "" })
    } else {
      onChange({ type: v })
    }
  }

  return (
    <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
      {/* Type selector + remove */}
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1.5">
          <div className="flex gap-2">
            <Select value={selectValue} onValueChange={handleTypeSelectChange}>
              <SelectTrigger size="sm" className="w-36 shrink-0">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
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
                className="h-8 text-sm placeholder:text-sm"
                placeholder="e.g. CCA, Gym, Work"
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

      {/* Day + Venue */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Day</Label>
          <Select
            value={String(session.day)}
            onValueChange={(v) => onChange({ day: Number(v) })}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Venue</Label>
          <Input
            className="h-8 text-sm placeholder:text-sm"
            placeholder="Optional"
            value={session.venue}
            onChange={(e) => onChange({ venue: e.target.value })}
          />
        </div>
      </div>

      {/* Start + End */}
      <div className="grid grid-cols-2 gap-2">
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

  const updateSession = (key: string, updates: Partial<SessionRow>) =>
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
    setForm((f) => ({ ...f, sessions: [...f.sessions, newSession()] }))

  const isValid =
    form.name.trim().length > 0 &&
    form.sessions.length > 0 &&
    form.sessions.every((s) => s.type.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit custom block" : "Add custom block"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-name">Name</Label>
            <Input
              id="cc-name"
              placeholder="e.g. Gym, Badminton CCA, External Course"
              value={form.name}
              maxLength={40}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
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
      </DialogContent>
    </Dialog>
  )
}

// ─── sidebar panel ───────────────────────────────────────────────────────────

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
        Custom Blocks
      </div>

      <hr />

      <div className="max-h-[30vh] overflow-y-auto">
        {courses.length === 0 ? (
          <p className="text-muted-foreground p-3 text-center text-sm">
            No blocks yet.
            <br />
            <span className="text-xs">
              Gym, CCA, custom mods, external courses&hellip;
            </span>
          </p>
        ) : (
          courses.map((course) => {
            const sessionLabels = course.sessions.map((s) => s.type).join(" · ")

            return (
              <div
                key={course.id}
                className="hover:bg-accent flex cursor-pointer items-center justify-between py-1 pr-1 pl-3 text-sm transition-colors"
                onClick={() => setEditingCourse(course)}>
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="max-w-[110px] truncate text-sm">
                    {course.name}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {sessionLabels}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCustomCourse(course.id)
                    if (editingCourse?.id === course.id) setEditingCourse(null)
                    posthog.capture("custom_course_deleted")
                  }}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )
          })
        )}
      </div>

      <hr />

      <button
        className="hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-1.5 p-2 text-sm transition-colors"
        onClick={() => setAddOpen(true)}>
        <Plus className="size-3.5" />
        Add custom block
      </button>

      <CourseModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => {
          addCustomCourse(data)
          posthog.capture("custom_course_created", {
            name_length: data.name.length,
            session_count: data.sessions.length,
            days: [...new Set(data.sessions.map((s) => s.day))],
            types: [...new Set(data.sessions.map((s) => s.type))]
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
            posthog.capture("custom_course_edited", {
              session_count_delta:
                data.sessions.length - editingCourse.sessions.length
            })
            updateCustomCourse(editingCourse.id, data)
          }
        }}
      />
    </div>
  )
}

export default CustomCourseEditor
