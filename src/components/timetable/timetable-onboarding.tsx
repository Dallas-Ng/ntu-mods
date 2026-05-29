"use client"

import { useBoundState } from "@/state/bound.state"
import { BotIcon, CalendarDaysIcon, WandIcon } from "lucide-react"
import posthog from "posthog-js"

import { useSettings } from "@/hooks/use-settings"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"

const MODES: {
  id: TimetableCreationMode
  label: string
  icon: React.ReactNode
  description: string
  detail: string
}[] = [
  {
    id: "default",
    label: "Calendar",
    icon: <CalendarDaysIcon className="size-8" />,
    description: "Classic timetable builder",
    detail:
      "Search for modules and manually choose your class indexes. Full control over every slot."
  },
  {
    id: "generation",
    label: "Generate",
    icon: <WandIcon className="size-8" />,
    description: "Preference-driven generation",
    detail:
      "Set constraints like free days, lunch breaks, and class spacing. Auto-generate the best timetable match."
  },
  {
    id: "ai",
    label: "AI Assistant",
    icon: <BotIcon className="size-8" />,
    description: "Chat to plan your timetable",
    detail:
      "Tell an AI your preferences in plain language. Runs locally in your browser — no cost, no data sent anywhere."
  }
]

const ModeCard = ({
  mode,
  onSelect
}: {
  mode: (typeof MODES)[0]
  onSelect: () => void
}) => (
  <button
    onClick={onSelect}
    className="hover:border-foreground flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors">
    <div className="text-muted-foreground">{mode.icon}</div>
    <div>
      <div className="font-semibold">{mode.label}</div>
      <div className="text-muted-foreground text-xs">{mode.description}</div>
    </div>
    <p className="text-muted-foreground text-xs">{mode.detail}</p>
    <div className="bg-foreground text-background mt-auto rounded-md px-3 py-1 text-xs font-medium">
      Use this
    </div>
  </button>
)

const OnboardingContent = ({ onDone }: { onDone: () => void }) => {
  const setMode = useBoundState((s) => s.setTimetableCreationMode)
  const setHasOnboarded = useBoundState((s) => s.setHasOnboarded)

  const handleSelect = (modeId: TimetableCreationMode) => {
    posthog.capture("onboarding_mode_selected", { mode: modeId })
    setMode(modeId)
    setHasOnboarded(true)
    onDone()
  }

  const handleSkip = () => {
    posthog.capture("onboarding_skipped")
    setHasOnboarded(true)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <ModeCard key={m.id} mode={m} onSelect={() => handleSelect(m.id)} />
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground text-xs underline transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  )
}

const TimetableOnboarding = () => {
  const hasOnboarded = useBoundState((s) => s.hasOnboarded)
  const setHasOnboarded = useBoundState((s) => s.setHasOnboarded)
  const { isMobile } = useSettings()

  if (hasOnboarded) return null

  const title = "How do you want to build your timetable?"

  if (isMobile) {
    return (
      <Drawer
        open={!hasOnboarded}
        onOpenChange={(o) => !o && setHasOnboarded(true)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">
            <OnboardingContent onDone={() => setHasOnboarded(true)} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={!hasOnboarded}
      onOpenChange={(o) => !o && setHasOnboarded(true)}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <OnboardingContent onDone={() => setHasOnboarded(true)} />
      </DialogContent>
    </Dialog>
  )
}

export default TimetableOnboarding
