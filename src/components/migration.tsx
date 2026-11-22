"use client"

import { useEffect } from "react"

export const Migration = () => {
  useEffect(() => {
    try {
      const existingKey = localStorage.getItem("lastUpdatedDate")
      const lastUpdatedDate = existingKey ? existingKey : null

      if (!lastUpdatedDate) {
        localStorage.removeItem("ntu-mods")
        localStorage.setItem("lastUpdatedDate", new Date().toString())
      }
    } catch {}
  }, [])

  return <></>
}
