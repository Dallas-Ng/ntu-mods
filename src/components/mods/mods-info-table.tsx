import { MODULE_CODE_RE } from "@/lib/constants"
import type { DbExam, DbModule } from "@/lib/server/db/types"
import { cn } from "@/lib/utils"

interface Props {
  module: DbModule
  exam?: DbExam | null
}

const FIELDS: Array<{ key: keyof DbModule; label: string }> = [
  { key: "gradeType", label: "Grade Type" },
  { key: "prerequisite", label: "Prerequisite" }
]

export function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function renderModuleValue(key: keyof DbModule, value: unknown) {
  if (key === "prerequisite" && Array.isArray(value)) {
    const allCodes = (value as string[][]).flat()
    const unique = Array.from(new Set(allCodes))
    return unique.map((item, idx) => (
      <span key={item}>
        {MODULE_CODE_RE.test(item) ? (
          <a
            href={`/mods/${item}`}
            className="text-blue-500 transition-colors hover:text-blue-600">
            {item}
          </a>
        ) : (
          item
        )}
        {idx < unique.length - 1 && ", "}
      </span>
    ))
  }
  if (Array.isArray(value)) return value.join(", ")
  if (key === "notOfferedAsBde" || key === "notOfferedAsUe") return "Yes"
  return String(value)
}

const ModsInfoTable = ({ module, exam }: Props) => (
  <div className="space-y-3">
    <table className="bg-background w-full text-sm">
      <tbody>
        <tr className="border-b">
          <td className="w-[200px] p-2">AUs</td>
          <td className="p-2">{module.au} AUs</td>
        </tr>

        {FIELDS.map(({ key, label }) => {
          const value = module[key]
          const has = hasValue(value)
          return (
            <tr key={key} className="border-b">
              <td
                className={cn(
                  "p-2 font-medium",
                  !has && "text-muted-foreground"
                )}>
                {label}
              </td>
              <td className="p-2">{has && renderModuleValue(key, value)}</td>
            </tr>
          )
        })}

        <tr>
          <td
            className={cn("p-2 font-medium", !exam && "text-muted-foreground")}>
            Exam
          </td>
          <td className="p-2">
            {exam ? `${exam.date}, ${exam.start_time} - ${exam.end_time}` : ""}
          </td>
        </tr>
      </tbody>
    </table>

    {exam && (
      <p className="text-muted-foreground text-xs">
        The Exam information shown may be subject to changes. Students are to
        check the finalised exam timetable with exam seat information, which
        will be available at the &apos;Examination Seating Arrangement&apos;
        webpage, 2 weeks before start of examination.
      </p>
    )}
  </div>
)

export default ModsInfoTable
