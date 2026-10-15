import { MODULE_CODE_RE } from "@/lib/constants"
import type { DbExam, DbModule } from "@/lib/server/db/types"
import { cn } from "@/lib/utils"

interface Props {
  module: DbModule
  exam?: DbExam | null
  /** Codes that have a module page; prerequisites outside it stay plain text. */
  knownCodes?: string[]
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

export function renderModuleValue(
  key: keyof DbModule,
  value: unknown,
  knownCodes?: ReadonlySet<string>
) {
  if (key === "prerequisite" && Array.isArray(value)) {
    const allCodes = (value as string[][]).flat()
    const unique = Array.from(new Set(allCodes))
    return unique.map((item, idx) => (
      <span key={item}>
        {MODULE_CODE_RE.test(item) && (!knownCodes || knownCodes.has(item)) ? (
          <a
            href={`/mods/${item}`}
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
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

const ModsInfoTable = ({ module, exam, knownCodes }: Props) => (
  <div className="space-y-3">
    <table className="data-table">
      <tbody>
        <tr>
          <td className="w-[200px]">AUs</td>
          <td>{module.au} AUs</td>
        </tr>

        {FIELDS.map(({ key, label }) => {
          const value = module[key]
          const has = hasValue(value)
          return (
            <tr key={key}>
              <td className={cn(!has && "text-muted-foreground")}>{label}</td>
              <td>
                {has &&
                  renderModuleValue(
                    key,
                    value,
                    knownCodes && new Set(knownCodes)
                  )}
              </td>
            </tr>
          )
        })}

        <tr>
          <td className={cn(!exam && "text-muted-foreground")}>Exam</td>
          <td>
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
