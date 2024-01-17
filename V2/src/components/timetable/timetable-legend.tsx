import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"

const TimetableLegend = () => {
  return (
    <div className="grid w-fit grid-cols-3 items-center justify-end gap-x-2 gap-y-1 md:w-auto md:grid-cols-6">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-[10px] w-[15px] rounded-full",
            getIndexTypeStyle("LEC").background
          )}
        />
        <span className="text-xs">LEC</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-[10px] w-[15px] rounded-full",
            getIndexTypeStyle("LAB").background
          )}
        />
        <span className="text-xs">LAB</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-[10px] w-[15px] rounded-full",
            getIndexTypeStyle("SEM").background
          )}
        />
        <span className="text-xs">SEM</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-[10px] w-[15px] rounded-full",
            getIndexTypeStyle("TUT").background
          )}
        />
        <span className="text-xs">TUT</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-[10px] w-[15px] rounded-full",
            getIndexTypeStyle("DES").background
          )}
        />
        <span className="text-xs">DES</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-[10px] w-[15px] rounded-full",
            getIndexTypeStyle("PRJ").background
          )}
        />
        <span className="text-xs">PRJ</span>
      </div>
    </div>
  )
}

export default TimetableLegend
