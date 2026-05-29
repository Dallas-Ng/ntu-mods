"use client"

import { useBoundState } from "@/state/bound.state"
import { BotIcon, CalendarDaysIcon, WandIcon } from "lucide-react"
import posthog from "posthog-js"

import { useSettings } from "@/hooks/use-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

const MODES: {
  id: TimetableCreationMode
  label: string
  icon: React.ReactNode
  description: string
  comingSoon?: boolean
}[] = [
  {
    id: "default",
    label: "Calendar",
    icon: <CalendarDaysIcon className="size-4" />,
    description: "Manually pick modules and class indexes"
  },
  {
    id: "generation",
    label: "Generate",
    icon: <WandIcon className="size-4" />,
    description: "Configure preferences and auto-generate a timetable",
    comingSoon: true
  },
  {
    id: "ai",
    label: "AI",
    icon: <BotIcon className="size-4" />,
    description: "Chat with an AI assistant to plan your timetable",
    comingSoon: true
  }
]

const TimetableModeSelector = () => {
  const mode = useBoundState((s) => s.timetableCreationMode)
  const setMode = useBoundState((s) => s.setTimetableCreationMode)
  const { isMobile } = useSettings()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex w-full rounded-lg border p-0.5">
        {MODES.map((m) => {
          const isActive = mode === m.id
          return (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (m.comingSoon) return
                    setMode(m.id)
                    posthog.capture("timetable_mode_changed", { mode: m.id })
                  }}
                  disabled={m.comingSoon}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    m.comingSoon
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : isActive
                        ? "bg-foreground text-background cursor-pointer"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  }`}
                  aria-pressed={isActive}
                  aria-label={m.label}>
                  {m.icon}
                  {!isMobile && <span>{m.label}</span>}
                  {isMobile && <span className="sr-only">{m.label}</span>}
                </button>
              </TooltipTrigger>
              {(isMobile || m.comingSoon) && (
                <TooltipContent side="bottom">
                  {m.comingSoon ? (
                    <p className="font-medium">Coming Soon</p>
                  ) : (
                    <>
                      <p className="font-medium">{m.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {m.description}
                      </p>
                    </>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export default TimetableModeSelector
