"use client"

import { BookOpen } from "lucide-react"

import { siteConfig } from "@/config/site"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { cardVariants, controlOnCard } from "@/components/ui/card"
import { CardCta } from "@/components/ui/text-link"
import { NewBadge } from "@/components/new-dot"
import AssistantPreview from "@/components/tools/assistant-preview"

// Static miniatures of each tool so the cards read differently at a glance.
// All share a fixed height so the cards line up.
const FgoPreview = () => (
  <div className="w-full max-w-xs space-y-1.5 text-xs" aria-hidden>
    <div className="text-muted-foreground flex justify-between px-3 pb-1 font-medium tracking-wide uppercase">
      <span>Module</span>
      <span>Result</span>
    </div>
    {[
      ["CSC1001", "D+", true],
      ["MAT2002", "B+", false],
      ["ECO1003", "C", true]
    ].map(([code, grade, picked]) => (
      <div
        key={code as string}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2",
          picked ? "bg-primary/10 ring-primary/30 ring-1" : "bg-muted"
        )}>
        <span className="font-mono">
          {code}{" "}
          <span className="text-muted-foreground ml-1 font-sans">{grade}</span>
        </span>
        <span
          className={cn(
            "w-10 rounded-full py-0.5 text-center font-semibold",
            picked
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}>
          {picked ? "P" : "Keep"}
        </span>
      </div>
    ))}
    <p className="flex justify-between px-3 pt-1.5">
      <span className="text-muted-foreground">Projected CGPA</span>
      <span>
        <span className="text-muted-foreground line-through">3.72</span>{" "}
        <span className="font-semibold text-emerald-500">3.91</span>
      </span>
    </p>
  </div>
)

const CgpaPreview = () => (
  <div className="w-full max-w-xs space-y-3 text-xs" aria-hidden>
    {[
      [
        "Highest Distinction",
        "4.50+",
        "Out of reach",
        "bg-muted-foreground/40",
        35
      ],
      ["Distinction", "4.00+", "Within reach", "bg-primary", 75],
      ["Merit", "3.50+", "Secured", "bg-emerald-500", 100]
    ].map(([label, min, status, color, w]) => (
      <div key={label as string} className="space-y-1.5">
        <div className="flex justify-between">
          <span className="font-medium">
            {label} <span className="text-muted-foreground">{min}</span>
          </span>
          <span className="text-muted-foreground">{status}</span>
        </div>
        <div className="bg-muted h-1.5 rounded-full">
          <div
            className={cn("h-full rounded-full", color as string)}
            style={{ width: `${w}%` }}
          />
        </div>
      </div>
    ))}
    <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2">
      Average grade needed:{" "}
      <span className="text-foreground font-semibold">B+</span> over 54 AU
    </p>
  </div>
)

const WallpaperPreview = () => (
  <div
    className="-mb-5 flex h-44 items-end justify-center md:mb-0 md:h-full"
    aria-hidden>
    <div className="bg-muted w-44 space-y-1.5 rounded-t-[2rem] border-[3px] border-b-0 px-3 pt-3 pb-0">
      <div className="bg-foreground/20 mx-auto h-1.5 w-12 rounded-full" />
      {/* Miniature timetable: grid exception to the type scale. */}
      <div className="text-muted-foreground pt-0.5 text-center text-[10px] font-medium">
        Mon
      </div>
      <div className="bg-primary/70 h-5 rounded" />
      <div className="h-8 rounded bg-emerald-500/70" />
      <div className="h-6 rounded bg-amber-500/70" />
      <div className="bg-primary/40 h-9 rounded" />
      <div className="h-5 rounded bg-rose-500/60" />
    </div>
  </div>
)

const PREVIEWS: Record<string, () => React.JSX.Element> = {
  "/tools/fgo-optimiser": FgoPreview,
  "/tools/cgpa-planner": CgpaPreview,
  "/screenshot": WallpaperPreview,
  "/developers/mcp": () => <AssistantPreview compact />
}

const ToolsGrid = () => (
  <div className="grid gap-3 md:grid-cols-2">
    {siteConfig.tools.map((tool, i, all) => {
      // An odd last tool spans the row, with its preview beside the text.
      const wide = all.length % 2 === 1 && i === all.length - 1
      const Preview = PREVIEWS[tool.href]
      return (
        <div
          key={tool.href}
          className={cn(
            cardVariants({ interactive: true }),
            "group relative flex flex-col gap-6 p-5 md:p-6",
            wide && "md:col-span-2 md:flex-row-reverse"
          )}>
          <div
            className={cn(
              "bg-background flex h-56 shrink-0 items-center justify-center overflow-hidden rounded-xl px-5 py-5 md:h-60 md:px-8 md:pb-0",
              wide && "md:w-96"
            )}>
            {Preview && <Preview />}
          </div>
          <div className="flex flex-1 flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tighter">
                  <a
                    href={tool.href}
                    onClick={() =>
                      track("tool_opened", {
                        tool: tool.name,
                        source: "tools_page"
                      })
                    }
                    className="after:absolute after:inset-0 after:rounded-2xl">
                    {tool.name}
                  </a>
                </h2>
                {tool.isNew && <NewBadge size="md" />}
              </div>
              <p
                className={cn(
                  "min-h-10 text-sm text-pretty md:text-base",
                  !wide && "md:min-h-12"
                )}>
                {tool.desc}
              </p>
              <p className="text-muted-foreground flex flex-wrap gap-x-2 text-sm">
                {[...tool.facts, tool.time].map((f, i) => (
                  <span
                    key={f}
                    className={cn(
                      "whitespace-nowrap",
                      i === 1 && "hidden sm:inline"
                    )}>
                    {i > 0 && <span className="mr-2">·</span>}
                    {f}
                  </span>
                ))}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <CardCta className="whitespace-nowrap">Open the tool</CardCta>
              {tool.guide && (
                <a
                  href={tool.guide.href}
                  onClick={() =>
                    track("tool_guide_clicked", {
                      tool: tool.name,
                      source: "tools_page"
                    })
                  }
                  className={cn(
                    controlOnCard,
                    "relative z-10 inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold whitespace-nowrap sm:px-4"
                  )}>
                  <BookOpen className="text-primary size-4" />
                  {tool.guide.label}
                </a>
              )}
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default ToolsGrid
