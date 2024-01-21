import { TRUN_DAY_MAP } from "@/lib/constants"

interface Props {
  days: number
  maxDayColumns: Record<number, number>
}

export const TimetableTableThead = ({ days, maxDayColumns }: Props) => (
  <thead>
    <tr>
      <th className="w-[28px] max-w-[28px] md:max-w-[40px]"></th>

      {Array.from({ length: days }, (_, i) => (
        <th key={i} colSpan={maxDayColumns[i + 1]}>
          {TRUN_DAY_MAP[i + 1]}
        </th>
      ))}
    </tr>
  </thead>
)
