"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { getModuleUrl } from "@/lib/module-url"
import type { PrerequisiteNode } from "@/lib/server/get-prerequisite-graph"

interface Props {
  moduleCode: string
  node: PrerequisiteNode
  graph: Record<string, PrerequisiteNode>
}

interface CardProps {
  code: string
  title?: string
  side: "left" | "right"
  ref: React.Ref<HTMLAnchorElement>
}

const ModuleCard = ({ code, title, side, ref }: CardProps) => (
  <Link
    ref={ref}
    href={getModuleUrl(code)}
    className="border-border bg-background hover:bg-muted group flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors"
    style={{ textAlign: side === "left" ? "right" : "left" }}>
    <span className="font-medium">{code}</span>
    {title && (
      <span className="text-muted-foreground line-clamp-1 text-xs leading-snug">
        {title}
      </span>
    )}
  </Link>
)

ModuleCard.displayName = "ModuleCard"

export default function ModsPrerequisiteGraph({
  moduleCode,
  node,
  graph,
}: Props) {
  const hasRequires = node.requires.length > 0
  const hasRequiredBy = node.requiredBy.length > 0

  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const rightRefs = useRef<(HTMLAnchorElement | null)[]>([])

  type PathEntry = { d: string; color: "amber" | "green" }
  const [paths, setPaths] = useState<PathEntry[]>([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const container = containerRef.current
    const center = centerRef.current
    if (!container || !center) return

    const update = () => {
      const cr = container.getBoundingClientRect()
      const nr = center.getBoundingClientRect()
      const cx = nr.left - cr.left
      const cy = nr.top - cr.top
      const cmy = cy + nr.height / 2

      const newPaths: PathEntry[] = []

      leftRefs.current.forEach((el) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const x1 = r.right - cr.left
        const y1 = r.top - cr.top + r.height / 2
        const x2 = cx
        const y2 = cmy
        const mx = (x1 + x2) / 2
        newPaths.push({
          d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
          color: "amber",
        })
      })

      rightRefs.current.forEach((el) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const x1 = cx + nr.width
        const y1 = cmy
        const x2 = r.left - cr.left
        const y2 = r.top - cr.top + r.height / 2
        const mx = (x1 + x2) / 2
        newPaths.push({
          d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
          color: "green",
        })
      })

      setSvgSize({ w: cr.width, h: cr.height })
      setPaths(newPaths)
    }

    const ro = new ResizeObserver(update)
    ro.observe(container)
    update()
    return () => ro.disconnect()
  }, [node])

  if (!hasRequires && !hasRequiredBy) return null

  const rightModules = node.requiredBy.slice(0, 15)

  return (
    <div>
      <h2 className="mb-6 text-lg">Prerequisite Graph</h2>

      <div ref={containerRef} className="relative">
        {/* SVG connector layer */}
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
                strokeOpacity={0.5}
              />
            ))}
          </svg>
        )}

        {/* Three-column layout */}
        <div className="relative flex items-center gap-6" style={{ zIndex: 1 }}>
          {/* Left: prerequisites */}
          {hasRequires ? (
            <div className="flex w-52 shrink-0 flex-col gap-2">
              <p className="text-muted-foreground mb-1 text-right text-xs font-medium uppercase tracking-wide">
                Required first
              </p>
              {node.requires.map((code, i) => (
                <ModuleCard
                  key={code}
                  code={code}
                  title={graph[code]?.title}
                  side="left"
                  ref={(el) => {
                    leftRefs.current[i] = el
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="w-52 shrink-0" />
          )}

          {/* Center: current module */}
          <div className="flex flex-1 flex-col items-center">
            <div
              ref={centerRef}
              className="border-primary bg-primary/5 w-full max-w-[160px] rounded-xl border-2 px-4 py-3 text-center shadow-sm">
              <span className="text-base font-bold">{moduleCode}</span>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {graph[moduleCode]?.title}
              </p>
            </div>
          </div>

          {/* Right: unlocked modules */}
          {hasRequiredBy ? (
            <div className="flex w-52 shrink-0 flex-col gap-2">
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Unlocks
              </p>
              {rightModules.map((code, i) => (
                <ModuleCard
                  key={code}
                  code={code}
                  title={graph[code]?.title}
                  side="right"
                  ref={(el) => {
                    rightRefs.current[i] = el
                  }}
                />
              ))}
              {node.requiredBy.length > 15 && (
                <span className="text-muted-foreground px-1 text-xs">
                  +{node.requiredBy.length - 15} more
                </span>
              )}
            </div>
          ) : (
            <div className="w-52 shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
