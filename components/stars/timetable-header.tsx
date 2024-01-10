import { cn } from "@/lib/utils"

import StarsEmptyCells from "./stars-empty-cells"
import StarsTableLegend from "./stars-table-legend"

interface Props {
  children?: React.ReactNode
  variant?: "share"
}

export default function TimetableHeader({ children, variant }: Props) {
  return (
    <>
      <div className="flex w-full flex-nowrap justify-between gap-2">
        <h1
          className={cn(
            "flex-1 break-words bg-gradient-to-r bg-clip-text text-3xl font-bold leading-[0.8] text-transparent",
            variant === "share"
              ? "from-rose-500 to-red-700 "
              : "from-blue-800 to-indigo-900 "
          )}>
          Stars* Planner{" "}
          {variant === "share" && (
            <span className="text-lg leading-none">shared by someone</span>
          )}
        </h1>

        <div className="w-[162px] md:w-fit">
          <StarsTableLegend />
        </div>
      </div>

      <div className="w-full">
        <StarsEmptyCells />
      </div>

      <div className="my-4 flex items-center gap-2">{children}</div>
    </>
  )
}
