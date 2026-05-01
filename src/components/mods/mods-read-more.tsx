"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
}

const ModsReadMore = ({ children }: Props) => {
  const [showMore, setShowMore] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      if (containerRef.current.clientHeight >= 500) {
        setShowButton(true)
      }
    }
  }, [])

  const handleToggle = () => {
    // When closing read more, we snap to the top of the page.
    if (showMore) window.scrollTo({ top: 0 })
    setShowMore((pS) => !pS)
  }

  return (
    <>
      <div
        className={cn(
          "overflow-hidden",
          showMore ? "max-h-[2000px]" : "max-h-[410px]"
        )}>
        <div ref={containerRef}>{children}</div>
      </div>

      {showButton ? (
        <div
          className="relative cursor-pointer text-center"
          onClick={handleToggle}>
          <div className="absolute inset-0 flex items-center">
            <div className="border-secondary w-full border-t" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-background text-muted-foreground px-2 text-sm">
              {showMore ? "Read less" : "Read more"}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-[20px]" />
      )}
    </>
  )
}

export default ModsReadMore
