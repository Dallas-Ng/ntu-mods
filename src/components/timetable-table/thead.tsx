import { TABLE_SETTINGS } from "@/config/table-settings"
import { TRUN_DAY_MAP } from "@/lib/constants"

interface Props {
  days: number
  maxDayColumns: Record<number, number>
}

export const TimetableTableThead = ({ days, maxDayColumns }: Props) => (
  <thead>
    <tr>
      <th className={TABLE_SETTINGS.TIMESLOT_CLASS}></th>

      {Array.from({ length: days }, (_, i) => (
        <th key={i} colSpan={maxDayColumns[i + 1]}>
          {TRUN_DAY_MAP[i + 1]}
        </th>
      ))}
    </tr>
  </thead>
)
