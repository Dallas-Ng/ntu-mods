"use client"

import {
  ArrowRight,
  BookOpen,
  Calculator,
  GraduationCap,
  Smartphone
} from "lucide-react"

import { siteConfig } from "@/config/site"
import { track } from "@/lib/analytics"

const ICONS = {
  calculator: Calculator,
  "graduation-cap": GraduationCap,
  smartphone: Smartphone
} as const

const ToolsGrid = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {siteConfig.tools.map((tool) => {
      const Icon = ICONS[tool.icon]
      return (
        <div
          key={tool.href}
          className="bg-card hover:bg-accent group relative flex flex-col gap-3 rounded-lg border p-4 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <span className="bg-muted text-muted-foreground group-hover:text-primary flex size-9 items-center justify-center rounded-md transition-colors">
              <Icon className="size-4" />
            </span>
            {tool.isNew && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                New
              </span>
            )}
          </div>

          <div className="space-y-1">
            <a
              href={tool.href}
              onClick={() =>
                track("tool_opened", {
                  tool: tool.name,
                  source: "tools_page"
                })
              }
              className="group-hover:text-primary text-sm font-medium after:absolute after:inset-0">
              {tool.name}
            </a>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {tool.desc}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-sm">
            <span className="text-muted-foreground group-hover:text-primary inline-flex items-center gap-1 transition-colors">
              Open tool <ArrowRight className="size-3.5" />
            </span>
            {tool.guide && (
              <a
                href={tool.guide.href}
                onClick={() =>
                  track("tool_guide_clicked", {
                    tool: tool.name,
                    source: "tools_page"
                  })
                }
                className="bg-background hover:bg-accent text-foreground relative z-10 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors">
                <BookOpen className="text-primary size-3.5" />
                {tool.guide.label}
              </a>
            )}
          </div>
        </div>
      )
    })}
  </div>
)

export default ToolsGrid
