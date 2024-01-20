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
          onClick={() => {
            // When closing read more, we snap to the top of the page.
            if (showMore) window.scrollTo({ top: 0 })
            setShowMore((pS) => !pS)
          }}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-secondary" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-sm text-muted-foreground ">
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
