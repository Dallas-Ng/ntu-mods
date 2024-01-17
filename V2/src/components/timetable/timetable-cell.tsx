import { formatRemarks } from "@/lib/format"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"

interface Props {
  moduleKey: string
  index: Index
  disableActions?: boolean
}

// TODO: Variations

const TimetableCell = (props: Props) => {
  const { moduleKey, index, disableActions } = props
  const indexStyle = getIndexTypeStyle(index.type)

  return (
    <td className="p-1" rowSpan={index.duration}>
      <div
        className={cn(
          "flex h-full cursor-pointer items-center break-words rounded-lg p-1 transition-colors md:px-3",
          indexStyle.background
        )}>
        <div className="w-full">
          <p>
            <span className={cn("font-bold", indexStyle.text)}>
              {moduleKey}
            </span>{" "}
            <span className={cn("font-semibold", indexStyle.textAlt)}>
              {getIndexType(index.type)}
            </span>{" "}
            {index.group}
          </p>

          <p>{index.venue}</p>

          <p>{formatRemarks(index.remarks)}</p>

          <p>{index.key}</p>
        </div>
      </div>
    </td>
  )
}

export default TimetableCell
