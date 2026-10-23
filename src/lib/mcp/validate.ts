// Input checks for the /mcp tools. The JSON Schema in definitions.ts is only
// advertised to clients; these run on the server, before any asset path or
// query is built from caller input.

import SEMESTERS from "@/data/api/semesters.json"

import { latestSemester, latestYear } from "@/lib/semesters"
import { ToolError } from "@/lib/webmcp/core"

export type Args = Record<string, unknown>

export const MODULE_CODE = /^[A-Z0-9]{2,12}$/
export const MAX_QUERY_LENGTH = 100
const CATEGORIES = ["CORE", "GLOAD", "MLOAD", "GERP", "CNY", "USP"]
const KNOWN_SEMESTERS = new Set(SEMESTERS.map((s) => s.code))

export function moduleCode(args: Args): string {
  const value = String(args.code ?? "")
    .trim()
    .toUpperCase()
  if (!MODULE_CODE.test(value)) {
    throw new ToolError(`"${String(args.code)}" is not a valid module code.`)
  }
  return value
}

/** A semester that has data. Both year and semester, or neither for the latest. */
export function semesterOf(args: Args) {
  const hasYear = args.year !== undefined
  const hasSemester = args.semester !== undefined
  if (hasYear !== hasSemester) {
    throw new ToolError(
      "Pass both year and semester, or neither for the latest."
    )
  }
  const year = String(args.year ?? latestYear)
  const semester = String(args.semester ?? latestSemester)
  if (!KNOWN_SEMESTERS.has(`${year};${semester}`)) {
    throw new ToolError(
      `No data for ${year};${semester}. Use list_semesters for the semesters that have data.`
    )
  }
  return {
    year,
    semester,
    isLatest: year === latestYear && semester === latestSemester
  }
}

export function queryOf(value: unknown): string {
  const query = String(value ?? "").trim()
  if (query.length > MAX_QUERY_LENGTH) {
    throw new ToolError(`query must be at most ${MAX_QUERY_LENGTH} characters.`)
  }
  return query
}

export function limitOf(value: unknown, fallback: number, max: number) {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback
}

/** Filters for search_modules. "all" means no filter. */
export function searchFilters(args: Args) {
  const category = String(args.category ?? "all")
  if (category !== "all" && !CATEGORIES.includes(category)) {
    throw new ToolError(`category must be one of ${CATEGORIES.join(", ")}.`)
  }
  const level = String(args.level ?? "all")
  if (level !== "all" && !/^[1-7]$/.test(level)) {
    throw new ToolError("level must be a digit from 1 to 7.")
  }
  const code = args.school ? String(args.school).toUpperCase() : ""
  if (code && !/^[A-Z0-9]{2,8}$/.test(code)) {
    throw new ToolError("school must be a school code such as CSC or EEE.")
  }
  const school = code && code !== "ALL" ? code : "all"
  let au: number | undefined
  if (args.au !== undefined) {
    au = Number(args.au)
    if (!Number.isFinite(au)) throw new ToolError("au must be a number.")
  }
  return { category, level, school, au }
}
