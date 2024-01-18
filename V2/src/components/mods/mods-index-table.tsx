import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/constants"

const ModsIndexTable = () => {
  return (
    <table className="w-full table-fixed border text-[0.6rem] md:text-xs">
      <thead>
        <tr>
          <th className="h-fit w-[40px] p-1 text-center">Time</th>
          {Array.from({ length: 5 }).map((_, i) => (
            <th key={i} className="p-2">
              {TRUN_DAY_MAP[i + 1]}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {STARS_TIMESLOTS.slice(0, 18).map((slot, idx) => (
          <tr key={slot.start}>
            <td className="relative w-[40px] border p-1 text-center">
              {idx !== 0 && (
                <span className="absolute left-0 top-[-8px] w-full bg-background">
                  {slot.start}
                </span>
              )}

              <div className="min-h-[20px] w-full" />
            </td>

            {Array.from({ length: 5 }).map((_, i) => {
              const randomChance = Math.floor(Math.random() * 100) + 1

              return (
                <td key={i} className="w-fit border p-1 text-center md:w-auto">
                  {randomChance <= 5 && "Coming Soon"}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ModsIndexTable
