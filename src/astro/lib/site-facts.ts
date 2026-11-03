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

/**
 * Numbers and article lists quoted by llms.txt and /ai-instructions, read from
 * the same data the site is built from so they cannot drift out of date.
 */
export async function getSiteFacts(): Promise<SiteFacts> {
  const [current, examSemester, articles, codes] = await Promise.all([
    getLatestSemester(),
    getLatestExamSemester(),
    getAllArticles(),
    getAllModuleCodes()
  ])
  const [{ modules, indexes }, examsData] = await Promise.all([
    getSemesterCounts(current.year, current.semester),
    examSemester
      ? getSemesterExamsData(examSemester.year, examSemester.semester)
      : Promise.resolve({})
  ])
  const exams = Object.keys(examsData).length

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
    uniqueModuleCodes: codes.length,
    articles,
    articlesByCategory
  }
}
