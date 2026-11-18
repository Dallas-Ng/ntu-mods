import {
  INDEX_TYPE_COLOR_KEYS,
  INDEX_TYPE_LABELS
} from "@/config/appearance-settings"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"

/** The read-only key under the timetable: which colour belongs to which type. */
const TimetableLegend = () => {
  return (
    <div className="grid w-fit grid-cols-3 items-center justify-end gap-x-2 gap-y-1 md:w-auto md:grid-cols-6">
      {INDEX_TYPE_COLOR_KEYS.map((key) => {
        const label = INDEX_TYPE_LABELS[key]

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={cn(
                "h-[10px] w-[15px] rounded-full",
                getIndexTypeStyle(label).background
              )}
            />
            <span className="text-xs">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default TimetableLegend
