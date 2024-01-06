"use client"

import { useRouter } from "next/navigation"
import { useBoundState } from "@/state/bound-state"
import { track } from "@vercel/analytics"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function DebugContent() {
  const state = useBoundState()
  const { coursesToIndex, settings, info, resetCourseToIndex, resetSettings } =
    state
  const router = useRouter()

  function resetApplicationState() {
    const confirmed = confirm(
      "If you encountered any problems, press confirm. Otherwise, press cancel."
    )

    if (confirmed) {
      track("reset")
      resetCourseToIndex()
      resetSettings()
      alert("Application state reset successfully.")
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex w-fit cursor-pointer items-center gap-1 text-sm hover:underline"
        onClick={() => router.back()}>
        <ArrowLeft className="h-5 w-5" />
        Go Back
      </Button>

      <div className="my-5">
        <p className="mb-2 text-secondary">
          If you encountered problems press the button below, it will{" "}
          <strong className="text-red-600">delete</strong> all your data
          (including the courses you added)
        </p>

        <Button onClick={resetApplicationState}>
          Click here to reset application state
        </Button>
      </div>

      <div className="rounded-lg border p-2 text-sm">
        <pre>{JSON.stringify({ coursesToIndex, settings, info }, null, 2)}</pre>
      </div>
    </>
  )
}
