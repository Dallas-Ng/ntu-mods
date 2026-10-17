import type { LucideIcon } from "lucide-react"

type Ring = {
  // Changing this restarts the turn (use the item currently shown)
  turnKey: string | number
  durationMs: number
  paused: boolean
  onDone: () => void
}

// A round icon button. With `ring` it draws a clock hand around its edge: one
// full turn, then `onDone` (advance to the next item).
const LandingCircleButton = ({
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
    className="bg-background hover:bg-accent relative flex size-9 items-center justify-center rounded-full transition-[background-color,transform] duration-150 active:scale-[0.94] motion-reduce:transition-none md:size-10">
    <Icon aria-hidden="true" className="size-5" />
    {ring && (
      <svg
        key={ring.turnKey}
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="text-primary pointer-events-none absolute inset-0 size-full -rotate-90">
        <circle
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
          style={{
            animation: `landing-ring ${ring.durationMs}ms linear forwards`,
            animationPlayState: ring.paused ? "paused" : "running"
          }}
          onAnimationEnd={ring.onDone}
        />
      </svg>
    )}
  </button>
)

export default LandingCircleButton
