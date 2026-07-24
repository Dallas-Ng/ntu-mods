"use client"

import { useEffect, useState } from "react"

// No client-side router in this app (plain <a> navigation), so each page load
// remounts consumers fresh. Starts "" on both server and client's first paint
// (avoids a hydration mismatch) then fills in the real pathname post-hydration.
export function usePathname() {
  const [pathname, setPathname] = useState("")

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  return pathname
}
