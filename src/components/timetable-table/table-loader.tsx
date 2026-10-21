import { TABLE_SETTINGS } from "@/config/table-settings"
import { STARS_TIMESLOTS } from "@/lib/constants"

import { TimetableTableThead } from "./thead"

export const TimeSlotItem = ({ startTime }: { startTime: number }) => (
  <th scope="row" className="text-foreground relative">
    <span className="bg-card absolute top-[-8px] left-0 w-full px-1 text-center">
      {startTime}
    </span>

    <div className={TABLE_SETTINGS.TIMESLOT_CLASS} />
  </th>
)

export const TimetableTableLoader = () => (
  // Same table, same days and rows as an empty plan renders (9:30 to 18:00), so
  // nothing moves when the real grid replaces it; it only pulses meanwhile.
  <table
    aria-hidden
    className="w-full table-fixed animate-pulse text-[0.6rem] motion-reduce:animate-none lg:text-xs">
    <TimetableTableThead
      days={5}
      maxDayColumns={{ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }}
    />

    <tbody>
      {STARS_TIMESLOTS.slice(3, 21).map((x, i) => (
        <tr key={i}>
          <TimeSlotItem startTime={x.start} />

          {Array.from({ length: 5 }, (_, i) => (
            <td key={i} />
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
