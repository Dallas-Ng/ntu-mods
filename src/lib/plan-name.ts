export const MAX_PLAN_NAME = 24

/** What a plan is called: the student's name for it, else "Plan 1" and so on. */
export const planLabel = (names: string[] | undefined, index: number) =>
  names?.[index]?.trim() || `Plan ${index + 1}`

/** True when the plan has its own name, so its "Plan N" id is worth showing. */
export const isPlanNamed = (names: string[] | undefined, index: number) =>
  Boolean(names?.[index]?.trim())
