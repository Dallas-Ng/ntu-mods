import { MODULE_CODE_RE } from "@/lib/constants"
import type { DbExam, DbModule } from "@/lib/server/db/types"

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

export const ROW_CLASS =
  "grid grid-cols-1 gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-4"

const ModsInfoTable = ({ module, exam, knownCodes }: Props) => (
  <div className="space-y-3">
    <dl className="bg-muted space-y-3 rounded-2xl p-5 text-sm">
      <div className={ROW_CLASS}>
        <dt className="text-muted-foreground">AUs</dt>
        <dd>{module.au} AUs</dd>
      </div>

      {FIELDS.map(({ key, label }) => {
        const value = module[key]
        const has = hasValue(value)
        return (
          <div key={key} className={ROW_CLASS}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">
              {has
                ? renderModuleValue(
                    key,
                    value,
                    knownCodes && new Set(knownCodes)
                  )
                : "None"}
            </dd>
          </div>
        )
      })}

      <div className={ROW_CLASS}>
        <dt className="text-muted-foreground">Exam</dt>
        <dd>
          {exam
            ? `${exam.date}, ${exam.start_time} - ${exam.end_time}`
            : "None"}
        </dd>
      </div>
    </dl>

    {exam && (
      <p className="text-muted-foreground px-1 text-xs text-pretty">
        The Exam information shown may be subject to changes. Students are to
        check the finalised exam timetable with exam seat information, which
        will be available at the &apos;Examination Seating Arrangement&apos;
        webpage, 2 weeks before start of examination.
      </p>
    )}
  </div>
)

export default ModsInfoTable
