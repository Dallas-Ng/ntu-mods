"use client"

import { useBoundState } from "@/state/bound.state"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

const DebugContent = () => {
  const state = useBoundState()
  const { resetTimetables, resetSettings } = state

  const resetApplicationState = () => {
    const confirmed = confirm(
      "If you encountered any problems, press confirm. Otherwise, press cancel."
    )

    if (confirmed) {
      resetTimetables()
      resetSettings()
      alert("Application state reset successfully.")
    }
  }

  return (
    <>
      <a href="/timetable">
        <Button
          variant="outline"
          size="sm"
          className="flex w-fit cursor-pointer items-center gap-1 text-sm">
          <ArrowLeft className="size-5" />
          Go Back to Timetable
        </Button>
      </a>

      <div className="my-5">
        <p className="text-muted-foreground mb-2">
          If you encountered problems press the button below, it will{" "}
          <strong className="text-destructive">delete</strong> all your data
          (including the courses you added)
        </p>

        <Button onClick={resetApplicationState}>
          Click here to reset application state
        </Button>
      </div>

      <div className="rounded-lg border p-2 text-sm">
        <pre>{JSON.stringify({ ...state }, null, 2)}</pre>
      </div>
    </>
  )
}
export default DebugContent
