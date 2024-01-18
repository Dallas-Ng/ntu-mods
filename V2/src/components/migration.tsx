"use client"

import { useEffect } from "react"

import { useTimetable } from "@/hooks/use-timetable"

/**
 * In the beta release, we used dabao-store key for persistent state.
 * This component migrates the old state to the new state.
 */
export const Migration = () => {
  const { migrateTimetable } = useTimetable()

  useEffect(() => {
    const oldContent = JSON.parse(localStorage.getItem("dabao-store") || "{}")
    if (oldContent) {
      if (localStorage.getItem("migrate")) return

      try {
        const oldContext = oldContent.state.coursesToIndex as {
          string: Index[]
        }
        const newContext: Timetable = {}
        Object.entries(oldContext).forEach(([k, v]) => {
          newContext[k] = v[0].key
        })

        migrateTimetable(newContext)
        localStorage.setItem("migrate", "true")
        localStorage.removeItem("dabao-store")
      } catch {
        // We don't try to migrate anymore as the users might have done stuff with their data already
        console.error("Failed to migrate")
        localStorage.setItem("migrate", "false")
      }
    }
  }, [])

  return <> </>
}
