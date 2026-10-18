"use client"

import { useEffect, useRef, useState } from "react"

import { getModuleUrl } from "@/lib/module-url"
import type { DbPrerequisiteNode } from "@/lib/server/db/types"

interface Props {
  moduleCode: string
  node: DbPrerequisiteNode
  graph: Record<string, { title: string }>
}

interface CardProps {
  code: string
  title?: string
  anchorRef: React.Ref<HTMLAnchorElement>
}

const PillCard = ({ code, title, anchorRef }: CardProps) => (
  <a
    ref={anchorRef}
    href={getModuleUrl(code)}
    className="bg-muted hover:bg-accent flex w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
    <span className="font-semibold">{code}</span>
    {title && (
      <span className="text-muted-foreground min-w-0 flex-1 truncate">
        {title}
      </span>
    )}
  </a>
)

const EmptyPill = ({ label }: { label: string }) => (
  <div className="border-border text-muted-foreground flex w-full items-center justify-center rounded-full border border-dashed px-3 py-1.5 text-xs">
    {label}
  </div>
)

type PathEntry = { d: string; color: "amber" | "green" }

export default function ModsPrerequisiteGraph({
  moduleCode,
  node,
  graph
}: Props) {
  const hasRequires = node.requires.length > 0
  const hasRequiredBy = node.requiredBy.length > 0

  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const topRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const bottomRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const [paths, setPaths] = useState<PathEntry[]>([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  const rightModules = node.requiredBy.slice(0, 15)

  useEffect(() => {
    const container = containerRef.current
    const center = centerRef.current
    if (!container || !center) return

    const update = () => {
      const cr = container.getBoundingClientRect()
      const nr = center.getBoundingClientRect()

      const cx = nr.left - cr.left
      const cy = nr.top - cr.top
      const cmx = cx + nr.width / 2
      const cmy = cy + nr.height / 2

      // Detect layout: column if top cards are above the center node
      const firstTop = topRefs.current.find(Boolean)
      const isColumn = firstTop
        ? firstTop.getBoundingClientRect().top < nr.top - 10
        : false

      const newPaths: PathEntry[] = []

      if (isColumn) {
        // Mobile: vertical beziers — top cards bottom → center top
        topRefs.current.forEach((el) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const x1 = r.left - cr.left + r.width / 2
          const y1 = r.bottom - cr.top
          const x2 = cmx
          const y2 = cy
          const my = (y1 + y2) / 2
          newPaths.push({
            d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`,
            color: "amber"
          })
        })
        // Center bottom → bottom cards top
        bottomRefs.current.forEach((el) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const x1 = cmx
          const y1 = cy + nr.height
          const x2 = r.left - cr.left + r.width / 2
          const y2 = r.top - cr.top
          const my = (y1 + y2) / 2
          newPaths.push({
            d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`,
            color: "green"
          })
        })
      } else {
        // Desktop: horizontal beziers — left cards right → center left
        topRefs.current.forEach((el) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const x1 = r.right - cr.left
          const y1 = r.top - cr.top + r.height / 2
          const x2 = cx
          const y2 = cmy
          const mx = (x1 + x2) / 2
          newPaths.push({
            d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
            color: "amber"
          })
        })
        // Center right → right cards left
        bottomRefs.current.forEach((el) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const x1 = cx + nr.width
          const y1 = cmy
          const x2 = r.left - cr.left
          const y2 = r.top - cr.top + r.height / 2
          const mx = (x1 + x2) / 2
          newPaths.push({
            d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
            color: "green"
          })
        })
      }

      setSvgSize({ w: cr.width, h: cr.height })
      setPaths(newPaths)
    }

    const ro = new ResizeObserver(update)
    ro.observe(container)
    update()
    return () => ro.disconnect()
  }, [node])

  if (!hasRequires && !hasRequiredBy) return null

  return (
    <div className="rounded-2xl border p-5">
      <h2 className="mb-6 text-lg font-semibold tracking-tight">
        Prerequisite graph
      </h2>

      <div ref={containerRef} className="relative">
        {svgSize.w > 0 && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={svgSize.w}
            height={svgSize.h}
            style={{ zIndex: 0 }}>
            {paths.map((p, i) => (
              <path
                key={i}
                d={p.d}
                fill="none"
                stroke={p.color === "amber" ? "#f59e0b" : "#22c55e"}
                strokeWidth={1.5}
                strokeOpacity={0.45}
              />
            ))}
          </svg>
        )}

        {/* Mobile: col. Desktop: row */}
        <div
          className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center"
          style={{ zIndex: 1 }}>
          {/* Top (mobile) / Left (desktop): prerequisites */}
          <div className="flex w-full flex-col gap-2 sm:flex-1 sm:items-end">
            <p className="text-muted-foreground w-full text-center text-xs font-medium sm:text-right">
              Required first
            </p>
            {hasRequires ? (
              node.requires.map((code, i) => (
                <PillCard
                  key={code}
                  code={code}
                  title={graph[code]?.title}
                  anchorRef={(el) => {
                    topRefs.current[i] = el
                  }}
                />
              ))
            ) : (
              <EmptyPill label="No prerequisite" />
            )}
          </div>

          {/* Center: current module */}
          <div className="flex shrink-0 flex-col items-center">
            <div
              ref={centerRef}
              className="bg-muted rounded-xl px-5 py-3 text-center">
              <span className="text-base font-bold">{moduleCode}</span>
              {graph[moduleCode]?.title && (
                <p className="text-muted-foreground mt-0.5 max-w-36 text-xs leading-snug">
                  {graph[moduleCode].title}
                </p>
              )}
            </div>
          </div>

          {/* Bottom (mobile) / Right (desktop): unlocked modules */}
          <div className="flex w-full flex-col gap-2 sm:flex-1 sm:items-start">
            <p className="bg-background text-muted-foreground relative z-10 w-full text-center text-xs font-medium sm:text-left">
              Unlocks
            </p>
            {hasRequiredBy ? (
              <>
                {rightModules.map((code, i) => (
                  <PillCard
                    key={code}
                    code={code}
                    title={graph[code]?.title}
                    anchorRef={(el) => {
                      bottomRefs.current[i] = el
                    }}
                  />
                ))}
                {node.requiredBy.length > 15 && (
                  <span className="text-muted-foreground text-xs">
                    +{node.requiredBy.length - 15} more
                  </span>
                )}
              </>
            ) : (
              <EmptyPill label="No modules unlocked" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
