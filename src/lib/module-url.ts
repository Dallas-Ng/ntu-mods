export const getModuleUrl = (code: string) => `/mods/${code}`

/**
 * Exam rows keep the exam portal's course-code suffixes (`MA3701*`,
 * `BF3218+`), which no /mods URL answers — module pages are keyed by the bare
 * alphanumeric code. Trim them so an exam row links to its module page.
 */
export const getExamModuleUrl = (examKey: string) =>
  getModuleUrl(examKey.replace(/[^A-Z0-9]+$/, ""))

export const getModuleVersionUrl = (
  code: string,
  year: string,
  semester: string
) => `/mods/${code}/${year}/${semester}`
