import { ChevronLeft, ChevronRight } from "lucide-react"

import LandingCircleButton from "./landing-circle-button"

type Props = {
  index: number
  total: number
  prevLabel: string
  nextLabel: string
  onPrev: () => void
  onNext: () => void
  // Passed to the next button; see LandingCircleButton
  ring?: React.ComponentProps<typeof LandingCircleButton>["ring"]
}

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
    <p
      aria-hidden="true"
      className="text-muted-foreground text-sm font-semibold tabular-nums">
      {index + 1} / {total}
    </p>
    <div className="flex gap-2">
      <LandingCircleButton
        label={prevLabel}
        Icon={ChevronLeft}
        onClick={onPrev}
      />
      <LandingCircleButton
        label={nextLabel}
        Icon={ChevronRight}
        onClick={onNext}
        ring={ring}
      />
    </div>
  </div>
)

export default LandingCarouselControls
