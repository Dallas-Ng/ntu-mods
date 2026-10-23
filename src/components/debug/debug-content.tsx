"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Code } from "@/components/developers/code"

const DebugContent = () => {
  const state = useBoundState()
  const { resetTimetables, resetSettings } = state

  const [confirmOpen, setConfirmOpen] = useState(false)

  const resetApplicationState = () => {
    resetTimetables()
    resetSettings()
    toast.success("Application state reset")
  }

  return (
    <>
      <a href="/timetable">
        <Button
          variant="outline"
          size="sm"
          className="flex w-fit cursor-pointer items-center gap-1 text-sm">
          <ArrowLeft className="size-4" />
          Go Back to Timetable
        </Button>
      </a>

      <div className="my-5">
        <p className="text-muted-foreground mb-2">
          If you encountered problems press the button below, it will{" "}
          <strong className="text-destructive">delete</strong> all your data
          (including the courses you added)
        </p>

        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Reset application state
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Reset application state?"
          description="This deletes your timetables, custom blocks and settings on this device."
          confirmLabel="Reset"
          destructive
          onConfirm={resetApplicationState}
        />
      </div>

      <Code code={JSON.stringify({ ...state }, null, 2)} lang="json" />
    </>
  )
}
export default DebugContent
