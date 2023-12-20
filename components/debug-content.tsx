"use client"

import { useRouter } from "next/navigation"
import { useBoundState } from "@/state/bound-state"

import { Button } from "@/components/ui/button"

export default function DebugContent() {
  const { coursesToIndex, resetCourseToIndex } = useBoundState()
  const router = useRouter()

  function resetApplicationState() {
    const confirmed = confirm(
      "If you encountered any problems, press confirm. Otherwise, press cancel."
    )

    if (confirmed) {
      resetCourseToIndex()
      alert("Application state reset successfully.")
    }
  }

  return (
    <>
      <span
        className="w-fit cursor-pointer hover:underline"
        onClick={() => router.back()}>
        Go Back
      </span>

      <div className="my-5">
        <p className="mb-2">
          If you encountered problems, it will delete all your data (including
          the courses you added)
        </p>

        <Button onClick={resetApplicationState}>
          Click here to reset application state
        </Button>
      </div>

      <pre>{JSON.stringify(coursesToIndex, null, 2)}</pre>
    </>
  )
}
