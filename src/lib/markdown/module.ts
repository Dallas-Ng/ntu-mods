import { MODULE_CATEGORY } from "@/lib/module-constants"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import type { DbExam, DbModule } from "@/lib/server/db/types"

import { escapeMarkdown, markdownTable } from "./format"

const days = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
]

interface ModuleMarkdownData {
  moduleData: DbModule
  indexes: Record<string, Index[]>
  exam: DbExam | null
  isCurrentOffering: boolean
  year: string
  semester: string
  otherSemesters?: { year: string; semester: string }[]
  origin: string | URL
}

export function renderModuleMarkdown({
  year: offeringYear,
  semester: offeringSemester,
  otherSemesters = [],
  origin,
  ...snapshot
}: ModuleMarkdownData) {
  const code = snapshot.moduleData.code
  const { moduleData, indexes, exam, isCurrentOffering } = snapshot
  const period =
    offeringSemester === "S" ? "Special Term" : `Semester ${offeringSemester}`
  const details = [
    ["Academic units", moduleData.au],
    ["Grade type", moduleData.gradeType],
    [
      "Categories",
      moduleData.categories
        ?.map((category) => MODULE_CATEGORY[category])
        .join(", ")
    ],
    ["Prerequisites", [...new Set(moduleData.prerequisite?.flat())].join(", ")],
    ["Mutually exclusive with", moduleData.mutuallyExclusiveWith?.join(", ")],
    ["Not available to programme", moduleData.notAvailableToProgramme],
    [
      "Not available to all programme with",
      moduleData.notAvailableToAllProgrammeWith
    ],
    [
      "Not available as BDE/UE to programme",
      moduleData.notAvailableAsBdeueToProgramme
    ],
    [
      "Not available as core to programme",
      moduleData.notAvailableAsCoreToProgramme
    ],
    [
      "Not available as PE to programme",
      moduleData.notAvailableAsPeToProgramme
    ],
    ["Exam", exam && `${exam.date}, ${exam.start_time} - ${exam.end_time}`],
    ...Object.entries(moduleData.extras ?? {})
  ].flatMap(([label, value]) =>
    value
      ? [
          `- ${escapeMarkdown(label ?? "")}: ${escapeMarkdown(value).replace(/\s+/g, " ")}`
        ]
      : []
  )
  const classes = Object.entries(indexes).flatMap(([index, slots]) =>
    slots.length
      ? slots.map((slot) => [
          index,
          slot.type,
          slot.group,
          days[slot.day] || "",
          slot.time,
          slot.venue,
          slot.remarks
        ])
      : [[index, "", "", "", "", "", ""]]
  )
  const otherOfferings =
    otherSemesters.map(
      ({ year, semester }) =>
        `- [AY${year}, ${semester === "S" ? "Special Term" : `Semester ${semester}`}](${new URL(getModuleVersionUrl(code, year, semester), origin).href})`
    ) ?? []

  return [
    `# ${code} ${escapeMarkdown(moduleData.title)}`,
    `AY${offeringYear}/${Number(offeringYear) + 1} ${period}`,
    isCurrentOffering
      ? ""
      : `Historical offering. See the [module page](${new URL(getModuleUrl(code), origin).href}) for the latest information.`,
    moduleData.description && escapeMarkdown(moduleData.description),
    details.join("\n"),
    "## Available indexes",
    classes.length
      ? markdownTable(
          ["Index", "Type", "Group", "Day", "Time", "Venue", "Remarks"],
          classes
        )
      : "No indexes available for this semester.",
    otherOfferings.length &&
      `## Other offerings\n\n${otherOfferings.join("\n")}`
  ]
    .filter(Boolean)
    .join("\n\n")
}
