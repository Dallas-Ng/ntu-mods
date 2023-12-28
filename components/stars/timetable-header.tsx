import { cn } from "@/lib/utils"

import StarsTableLegend from "./stars-table-legend"

interface Props {
  children?: React.ReactNode
  variant?: "share"
}

export default function TimetableHeader({ children, variant }: Props) {
  return (
    <>
      <div className="flex w-full items-baseline justify-between">
        <h1
          className={cn(
            "bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent",
            variant === "share"
              ? "from-rose-500 to-red-700 "
              : "from-blue-800 to-indigo-900 "
          )}>
          Stars* Planner{" "}
          {variant === "share" && (
            <span className="text-lg">shared by someone</span>
          )}
        </h1>

        <StarsTableLegend />
      </div>

      <div className="my-2 flex items-center gap-2">{children}</div>
    </>
  )
}
