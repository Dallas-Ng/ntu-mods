import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { controlOnCard } from "@/components/ui/card"

type Ring = {
  // Changing this restarts the turn (use the item currently shown)
  turnKey: string | number
  durationMs: number
  onDone: () => void
}

type Props = {
  index: number
  total: number
  prevLabel: string
  nextLabel: string
  onPrev: () => void
  onNext: () => void
  // Draws a clock hand around the next button; one full turn calls onDone.
  // The animation only exists without reduced motion, so with it there is no
  // hand and nothing advances by itself.
  ring?: Ring
}

const CircleButton = ({
  label,
  Icon,
  onClick,
  ring
}: {
  label: string
  Icon: LucideIcon
  onClick: () => void
  ring?: Ring
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={cn(
      controlOnCard,
      "relative flex size-9 items-center justify-center rounded-full duration-150 motion-reduce:transition-none md:size-10"
    )}>
    <Icon aria-hidden="true" className="size-4" />
    {ring && (
      <svg
        key={ring.turnKey}
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="text-primary pointer-events-none absolute inset-0 size-full -rotate-90">
        <circle
          className="landing-ring"
          cx="20"
          cy="20"
          r="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          style={
            {
              "--ring-ms": `${ring.durationMs}ms`
            } as React.CSSProperties
          }
          onAnimationEnd={ring.onDone}
        />
      </svg>
    )}
  </button>
)

// The "n / N" counter and previous / next buttons shared by both timetable
// cards. On phones the row spans the card and sits above the text; from md up
// it sits to the right of it.
const LandingCarouselControls = ({
  index,
  total,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  ring
}: Props) => (
  <div className="flex w-full shrink-0 items-center justify-between gap-3 md:w-auto md:justify-end">
    {/* Reserve the width of the longest label ("10 / 10") so the row never
        resizes when the count reaches two digits. */}
    <p
      aria-hidden="true"
      className="text-muted-foreground text-right text-sm font-semibold tabular-nums"
      style={{ minWidth: `${String(total).length * 2 + 3}ch` }}>
      {index + 1} / {total}
    </p>
    <div className="flex gap-2">
      <CircleButton label={prevLabel} Icon={ChevronLeft} onClick={onPrev} />
      <CircleButton
        label={nextLabel}
        Icon={ChevronRight}
        onClick={onNext}
        ring={ring}
      />
    </div>
  </div>
)

export default LandingCarouselControls
