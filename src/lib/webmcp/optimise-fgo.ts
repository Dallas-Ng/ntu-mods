import { cgpa, optimise, quotaUsage, type Mod } from "@/lib/fgo"

import { ToolError, type ToolHandler } from "./core"

function validAu(value: unknown, min: number): value is number {
  return (
    typeof value === "number" &&
    value >= min &&
    value <= 24 &&
    Number.isInteger(value * 2)
  )
}

export const optimiseFgo: ToolHandler = ({
  quota,
  usedCoreAu,
  usedBdeAu,
  modules
}) => {
  if (quota !== 21 && quota !== 24)
    throw new ToolError("quota must be 21 or 24 AU.")
  if (!validAu(usedCoreAu, 0) || !validAu(usedBdeAu, 0))
    throw new ToolError(
      "Used FGO AU must be between 0 and 24 in half-AU steps."
    )
  if (!Array.isArray(modules) || modules.length < 1 || modules.length > 200)
    throw new ToolError("Supply between 1 and 200 letter-graded modules.")

  const bde = new Set<string>()
  const grades = Array.from(modules, (row: unknown, index): Mod => {
    if (!row || typeof row !== "object")
      throw new ToolError(`Module ${index + 1} must be an object.`)
    const {
      au,
      gradePoints,
      eligible,
      bde: isBde
    } = row as Record<string, unknown>
    if (
      !validAu(au, 0.5) ||
      typeof gradePoints !== "number" ||
      !Number.isFinite(gradePoints) ||
      gradePoints < 0 ||
      gradePoints > 5 ||
      typeof eligible !== "boolean" ||
      typeof isBde !== "boolean"
    ) {
      throw new ToolError(
        `Module ${index + 1} has invalid AU, grade points or eligibility flags.`
      )
    }
    const id = String(index + 1)
    if (isBde) bde.add(id)
    return {
      id,
      au,
      gp: gradePoints,
      status: "graded",
      locked: !eligible || gradePoints === 0,
      code: "",
      name: "",
      term: "",
      grade: ""
    }
  })
  const extra = { core: usedCoreAu, bde: usedBdeAu }
  const selected = optimise(grades, { quota, bde, extra })
  return {
    currentCgpa: cgpa(grades),
    projectedCgpa: cgpa(grades, selected),
    selectedModulePositions: [...selected].map(Number).sort((a, b) => a - b),
    quotaUsedAfter: quotaUsage(grades, selected, bde, extra),
    note: "Positions start at 1. Confirm FGO eligibility and quota with NTU."
  }
}
