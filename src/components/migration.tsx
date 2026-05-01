"use client"

import { useEffect } from "react"

/**
 * In an older release, we used dabao-store key for persistent state.
 * This component migrates the old state to the new state.
 *
 * TODO: remove this component in the future
 */
export const Migration = () => {
  // const { migrateTimetable } = useTimetable()

  useEffect(() => {
    const existingKey = localStorage.getItem("lastUpdatedDate")
    const lastUpdatedDate = existingKey ? existingKey : null

    if (!lastUpdatedDate) {
      localStorage.removeItem("ntu-mods")
      localStorage.setItem("lastUpdatedDate", new Date().toString())
    }

    // const oldContent = JSON.parse(localStorage.getItem("ntu-mods") || "{}")
    // if (oldContent) {
    //   if (localStorage.getItem("migrate")) return

    //   try {
    //     const oldContext = oldContent.state.coursesToIndex as {
    //       string: Index[]
    //     }
    //     const newContext: Timetable = {}
    //     Object.entries(oldContext).forEach(([k, v]) => {
    //       newContext[k] = v[0].key
    //     })

    //     migrateTimetable(newContext)
    //     localStorage.setItem("migrate", "true")
    //     localStorage.removeItem("dabao-store")
    //   } catch {
    //     // We don't try to migrate anymore as the users might have done stuff with their data already
    //     console.error("Failed to migrate")
    //     localStorage.setItem("migrate", "false")
    //   }
    // }
  }, [])

  return <></>
}
