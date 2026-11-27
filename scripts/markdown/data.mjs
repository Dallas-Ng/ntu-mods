import { getApiGroups } from "../../src/lib/developers/api-groups.ts"
import { parseDisplayDateUtc } from "../../src/lib/format.ts"
import { markdownTable, escapeMarkdown } from "../../src/lib/markdown/format.ts"
import { renderModuleMarkdown } from "../../src/lib/markdown/module.ts"
import { getExamModuleUrl } from "../../src/lib/module-url.ts"
import {
  getCurrentYearExamSemesters,
  getLatestSemester,
  getModuleMetadata,
  getModuleExamData,
  getModuleIndexesData,
  getModuleSemesters,
  getSemesterExamsData
} from "../../src/lib/server/db/repo.ts"
import { discardIslands } from "./html.mjs"

export async function modulePage({ page, url }) {
  const code = page.split("/").at(-1)
  const { year, semester } = await getLatestSemester()
  const [moduleData, indexes, exam, offerings] = await Promise.all([
    getModuleMetadata(code, year, semester),
    getModuleIndexesData(code, year, semester),
    getModuleExamData(code, year, semester),
    getModuleSemesters(code)
  ])
  if (!moduleData) throw new Error(`Missing module data for ${page}`)
  return renderModuleMarkdown({
    moduleData,
    indexes,
    exam,
    isCurrentOffering: true,
    year,
    semester,
    otherSemesters: offerings.filter(
      (offering) => offering.year !== year || offering.semester !== semester
    ),
    origin: url.origin
  })
}

export async function exams(context) {
  discardIslands(context, ["exams-list"])
  for (const { year, semester } of await getCurrentYearExamSemesters()) {
    const entries = Object.values(await getSemesterExamsData(year, semester))
    entries.sort(
      (a, b) =>
        parseDisplayDateUtc(a.date) - parseDisplayDateUtc(b.date) ||
        a.key.localeCompare(b.key)
    )
    const rows = entries.map(({ key, name, date, start_time, end_time }) => [
      `[${escapeMarkdown(key)}](${new URL(getExamModuleUrl(key), context.url).href})`,
      name,
      date,
      start_time,
      end_time
    ])
    context.append.push(
      `## AY${year} Semester ${semester}\n\n${markdownTable(
        ["Module", "Title", "Date", "Starts", "Ends"],
        rows,
        { formattedColumns: [0] }
      )}`
    )
  }
}

export async function apiReference(context) {
  discardIslands(context, ["api-explorer"])
  const discovery = context.page === "/developers/discovery"
  for (const group of (await getApiGroups()).filter(
    (group) => (group.name === "Discovery") === discovery
  )) {
    context.append.push(`## ${group.name}`, group.description)
    for (const op of group.ops) {
      context.append.push(
        `### ${op.summary}\n\n\`GET ${op.path}\``,
        op.description
      )
      if (op.params.length)
        context.append.push(
          markdownTable(
            ["Parameter", "Location", "Description"],
            op.params.map(({ name, where, description }) => [
              name,
              where,
              description
            ])
          )
        )
      if (op.fields?.length)
        context.append.push(
          op.fieldsNote,
          markdownTable(["Field", "Type", "Description"], op.fields)
        )
      if (op.responses.length)
        context.append.push(
          markdownTable(
            ["Status", "Response"],
            op.responses.map(({ status, description }) => [status, description])
          )
        )
      context.append.push(`\`\`\`bash\n${op.request}\n\`\`\``)
      if (op.response)
        context.append.push(`\`\`\`${op.responseLang}\n${op.response}\n\`\`\``)
    }
  }
}
