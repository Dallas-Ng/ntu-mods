import type { AllModule } from "@/types/mods"

/**
 * Whether a module is offered in `semester` ("YYYY;S"). `semesters` lists the
 * selectable semesters a module is offered in; payloads built before it
 * existed only know about the latest one.
 */
export const offeredIn = (
  module: Pick<AllModule, "semesters" | "isCurrentSemester">,
  semester: string
) =>
  module.semesters
    ? module.semesters.includes(semester)
    : module.isCurrentSemester === true
