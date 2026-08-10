import { REMARK_SCOPE_DOT_CLASS } from "@/lib/remark-scope"
import { cn } from "@/lib/utils"

interface Props {
  moduleRemark?: string
  indexRemark?: string
}

/** Shared body for the tooltip shown on the timetable block and the
 * sidebar row — keeps the two in sync when either changes. */
export const RemarkTooltipContent = ({ moduleRemark, indexRemark }: Props) => (
  <>
    {moduleRemark && (
      <p>
        <span
          className={cn(
            "mr-1 inline-block size-1.5 rounded-full",
            REMARK_SCOPE_DOT_CLASS.module
          )}
        />
        <span className="font-semibold">Module: </span>
        {moduleRemark}
      </p>
    )}
    {indexRemark && (
      <p>
        <span
          className={cn(
            "mr-1 inline-block size-1.5 rounded-full",
            REMARK_SCOPE_DOT_CLASS.index
          )}
        />
        <span className="font-semibold">Index: </span>
        {indexRemark}
      </p>
    )}
  </>
)
