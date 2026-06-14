"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function useNewDot(storageKey: string, triggerRoute: string) {
  const [isNew, setIsNew] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsNew(!localStorage.getItem(storageKey))
  }, [storageKey])

  useEffect(() => {
    if (isNew && pathname.startsWith(triggerRoute)) {
      localStorage.setItem(storageKey, "1")
      setIsNew(false)
    }
  }, [pathname, triggerRoute, storageKey, isNew])

  return isNew
}

export function NewDot({
  storageKey,
  triggerRoute,
  className
}: {
  storageKey: string
  triggerRoute: string
  className?: string
}) {
  const isNew = useNewDot(storageKey, triggerRoute)

  if (!isNew) return null

  return (
    <span className={className} aria-label="New" role="status">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
    </span>
  )
}
