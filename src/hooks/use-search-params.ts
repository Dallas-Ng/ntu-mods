"use client"

import { useEffect, useState } from "react"

const SEARCH_PARAMS_CHANGE_EVENT = "ntumods:search-params-change"

const readSearchParams = () =>
  typeof window === "undefined"
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search)

// Drop-in-ish replacement for next/navigation's useSearchParams()/useRouter()
// pairing, backed by plain history.pushState/replaceState so it works with no
// client router. Starts empty on both server and client's first paint (avoids
// a hydration mismatch) then fills in the real params post-hydration.
export function useSearchParams() {
  const [params, setParams] = useState<URLSearchParams>(
    () => new URLSearchParams()
  )

  useEffect(() => {
    const sync = () => setParams(readSearchParams())
    sync()
    window.addEventListener(SEARCH_PARAMS_CHANGE_EVENT, sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener(SEARCH_PARAMS_CHANGE_EVENT, sync)
      window.removeEventListener("popstate", sync)
    }
  }, [])

  return params
}

export function replaceSearchParams(pathname: string, nextQuery: string) {
  const url = nextQuery ? `${pathname}?${nextQuery}` : pathname
  window.history.replaceState(window.history.state, "", url)
  window.dispatchEvent(new Event(SEARCH_PARAMS_CHANGE_EVENT))
}

export function pushSearchParams(pathname: string, nextQuery: string) {
  const url = nextQuery ? `${pathname}?${nextQuery}` : pathname
  window.history.pushState(window.history.state, "", url)
  window.dispatchEvent(new Event(SEARCH_PARAMS_CHANGE_EVENT))
}
