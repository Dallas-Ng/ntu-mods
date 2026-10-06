import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import {
  getAllModuleCodes,
  getLatestExamSemester,
  getLatestSemester,
  getSemesterCounts,
  getSemesterExamsData
} from "@/lib/server/db/repo"
import { getAllArticles, type Article } from "@/astro/lib/articles"

export interface SiteFacts {
  semesterLabel: string
  modules: number
  indexes: number
  exams: number
  /** Distinct module codes across every recorded semester. */
  uniqueModuleCodes: number
  articles: Article[]
  /** Articles grouped by category, largest group first. */
  articlesByCategory: { category: string; articles: Article[] }[]
}

const fmt = (n: number) => n.toLocaleString("en-US")
export { fmt as formatCount }

/**
 * Numbers and article lists quoted by llms.txt and /ai-instructions, read from
 * the same data the site is built from so they cannot drift out of date.
 */
export async function getSiteFacts(): Promise<SiteFacts> {
  const { year, semester } = await getLatestSemester()
  const { modules, indexes } = await getSemesterCounts(year, semester)
  const examSemester = await getLatestExamSemester()
  const exams = examSemester
    ? Object.keys(
        await getSemesterExamsData(examSemester.year, examSemester.semester)
      ).length
    : 0
  const articles = await getAllArticles()

  const groups = new Map<string, Article[]>()
  for (const a of articles) {
    groups.set(a.category, [...(groups.get(a.category) ?? []), a])
  }
  const articlesByCategory = [...groups.entries()]
    .map(([category, list]) => ({ category, articles: list }))
    .sort(
      (a, b) =>
        b.articles.length - a.articles.length ||
        a.category.localeCompare(b.category)
    )

  return {
    semesterLabel: LATEST_SEMESTER_LABEL,
    modules,
    indexes,
    exams,
    uniqueModuleCodes: (await getAllModuleCodes()).length,
    articles,
    articlesByCategory
  }
}
