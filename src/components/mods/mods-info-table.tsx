import Link from "next/link"

import type { ApiExam } from "@/lib/server/get-module-exam-data"
import type { ApiModule } from "@/lib/server/get-module-metadata"

const MODULE_CODE_RE = /^[A-Z]{2,6}\d{4}[A-Z]?$/

interface Props {
  module: ApiModule
  exam?: ApiExam | null
}

const KNOWN_FIELD_LABELS: Array<{ key: keyof ApiModule; label: string }> = [
  { key: "gradeType", label: "Grade Type" },
  { key: "prerequisite", label: "Prerequisite" },
  { key: "notAvailableToProgramme", label: "Not Available To Programme" },
  {
    key: "notAvailableToAllProgrammeWith",
    label: "Not Available To All Programme With"
  },
  {
    key: "notAvailableAsBdeueToProgramme",
    label: "Not Available As BDE/UE To Programme"
  },
  {
    key: "notAvailableAsCoreToProgramme",
    label: "Not Available As Core To Programme"
  },
  {
    key: "notAvailableAsPeToProgramme",
    label: "Not Available As PE To Programme"
  },
  { key: "mutuallyExclusiveWith", label: "Mutually Exclusive With" },
  { key: "notOfferedAsBde", label: "Not Offered As BDE" },
  { key: "notOfferedAsUe", label: "Not Offered As Unrestricted Elective" }
]

const ModsInfoTable = ({ module, exam }: Props) => (
  <table className="bg-background text-sm">
    <tbody>
      <tr>
        <td className="w-[220px] p-2">AUs</td>
        <td className="p-2">{module.au} AUs</td>
      </tr>

      {KNOWN_FIELD_LABELS.map(({ key, label }) => {
        const value = module[key]

        const renderValue = () => {
          // 1. Handle special case: Prerequisites
          if (key === "prerequisite" && Array.isArray(value)) {
            const allCodes = (value as string[][]).flat()
            const unique = Array.from(new Set(allCodes))

            return unique.map((item, idx) => (
              <span key={item}>
                {MODULE_CODE_RE.test(item) ? (
                  <Link
                    href={`/mods/${item}`}
                    className="text-blue-500 transition-colors hover:text-blue-600">
                    {item}
                  </Link>
                ) : (
                  item
                )}
                {idx < unique.length - 1 && ", "}
              </span>
            ))
          }

          // 2. Handle generic Arrays
          if (Array.isArray(value)) return value.join(", ")

          // 3. Handle boolean flag fields (stored as string "true" from scraper)
          if (key === "notOfferedAsBde" || key === "notOfferedAsUe")
            return "Yes"

          // 4. Handle Strings/Numbers
          return String(value)
        }

        return (
          <tr key={key} className="border-b">
            <td className="p-2 font-medium">{label}</td>
            <td className="p-2">{value && renderValue()}</td>
          </tr>
        )
      })}

      {module.extras &&
        Object.entries(module.extras).map(([label, value]) => (
          <tr key={label}>
            <td className="p-2">{label}</td>
            <td className="p-2">{value}</td>
          </tr>
        ))}

      <tr>
        <td className="p-2">Exam</td>
        <td className="p-2">
          {exam ? `${exam.date}, ${exam.start_time} - ${exam.end_time}` : ""}
        </td>
      </tr>
    </tbody>
  </table>
)

export default ModsInfoTable
