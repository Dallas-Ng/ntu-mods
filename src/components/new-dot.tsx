"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"

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

const NEW_BADGE_SIZES = {
  sm: "px-1.5 py-0.5 text-[10px] leading-none",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm"
}

/** Yellow pill marking something new, or a count of unseen items. */
export function NewBadge({
  size = "sm",
  className,
  children = "New"
}: {
  size?: keyof typeof NEW_BADGE_SIZES
  className?: string
  children?: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-yellow-400 font-semibold tracking-normal text-black",
        NEW_BADGE_SIZES[size],
        className
      )}>
      {children}
    </span>
  )
}
