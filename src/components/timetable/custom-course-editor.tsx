"use client"

import { useEffect, useState } from "react"
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react"

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
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

interface FormState {
  name: string
  day: number
  startTime: number
  endTime: number
  venue: string
  color: CustomCourseColor
}

const DEFAULT_FORM: FormState = {
  name: "",
  day: 1,
  startTime: 900,
  endTime: 1000,
  venue: "",
  color: DEFAULT_CUSTOM_COURSE_COLOR
}

interface CourseFormProps {
  initial?: FormState
  onSave: (form: FormState) => void
  onCancel: () => void
}

const CourseForm = ({ initial, onSave, onCancel }: CourseFormProps) => {
  const [form, setForm] = useState<FormState>(initial ?? DEFAULT_FORM)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validEndTimes = END_TIME_OPTIONS.filter((t) => t.value > form.startTime)

  const handleStartTimeChange = (v: number) => {
    set("startTime", v)
    if (form.endTime <= v) {
      const next = END_TIME_OPTIONS.find((t) => t.value > v)
      if (next) set("endTime", next.value)
    }
  }

  const isValid = form.name.trim().length > 0 && form.endTime > form.startTime

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="cc-name">Name</Label>
        <Input
          id="cc-name"
          placeholder="e.g. Gym, Lunch, CCA"
          value={form.name}
          maxLength={40}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cc-day">Day</Label>
          <select
            id="cc-day"
            value={form.day}
            onChange={(e) => set("day", Number(e.target.value))}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none">
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cc-venue">Venue (optional)</Label>
          <Input
            id="cc-venue"
            placeholder="e.g. Sports Hall"
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cc-start">Start time</Label>
          <select
            id="cc-start"
            value={form.startTime}
            onChange={(e) => handleStartTimeChange(Number(e.target.value))}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none">
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cc-end">End time</Label>
          <select
            id="cc-end"
            value={form.endTime}
            onChange={(e) => set("endTime", Number(e.target.value))}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none">
            {validEndTimes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Colour</Label>
        <div className="flex gap-2">
          {(Object.keys(CUSTOM_COURSE_COLORS) as CustomCourseColor[]).map(
            (color) => (
              <button
                key={color}
                type="button"
                aria-label={CUSTOM_COURSE_COLORS[color].label}
                onClick={() => set("color", color)}
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

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!isValid} onClick={() => onSave(form)}>
          Save
        </Button>
      </div>
    </div>
  )
}

const CustomCourseEditor = () => {
  const timetableIndex = useBoundState((s) => s.timetableIndex)
  const customCourses = useBoundState((s) => s.customCourses)
  const addCustomCourse = useBoundState((s) => s.addCustomCourse)
  const updateCustomCourse = useBoundState((s) => s.updateCustomCourse)
  const removeCustomCourse = useBoundState((s) => s.removeCustomCourse)

  const courses = customCourses[timetableIndex] ?? []

  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setAddOpen(false)
    setEditingId(null)
  }, [timetableIndex])

  const handleAdd = (form: FormState) => {
    addCustomCourse(form)
    setAddOpen(false)
  }

  const handleEdit = (id: string, form: FormState) => {
    updateCustomCourse(id, form)
    setEditingId(null)
  }

  return (
    <div className="rounded-lg border-2">
      <div className="text-muted-foreground p-2 text-center text-xs">
        Custom Courses
      </div>

      <hr />

      <div className="max-h-[30vh] overflow-y-auto">
        {courses.map((course) => {
          const colorStyle = CUSTOM_COURSE_COLORS[course.color]
          const isEditing = editingId === course.id

          return (
            <div key={course.id}>
              <div
                className={cn(
                  "hover:bg-accent cursor-pointer pr-1 pl-3 text-sm transition-colors",
                  isEditing && "bg-muted rounded-b-none"
                )}
                onClick={() =>
                  setEditingId((id) => (id === course.id ? null : course.id))
                }>
                <div className="flex w-full items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full flex-shrink-0",
                        colorStyle.swatch
                      )}
                    />
                    <span className="truncate max-w-[120px]">{course.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][course.day - 1]}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div
                      className="flex size-8 cursor-pointer items-center justify-center p-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCustomCourse(course.id)
                        if (editingId === course.id) setEditingId(null)
                      }}>
                      <TrashIcon className="text-muted-foreground hover:text-foreground size-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="border-t px-3 pb-3">
                  <CourseForm
                    initial={{
                      name: course.name,
                      day: course.day,
                      startTime: course.startTime,
                      endTime: course.endTime,
                      venue: course.venue,
                      color: course.color
                    }}
                    onSave={(form) => handleEdit(course.id, form)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <button className="hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-1.5 p-2 text-sm transition-colors">
            <PlusIcon className="size-3.5" />
            Add custom course
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add custom course</DialogTitle>
          </DialogHeader>
          <CourseForm
            onSave={handleAdd}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomCourseEditor
