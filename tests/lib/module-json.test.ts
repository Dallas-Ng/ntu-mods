import { describe, expect, it } from "vitest"

import { toModuleJson } from "@/lib/module-json"
import type { ModuleFullSnapshot } from "@/lib/server/edge/get-module-snapshot"

const snapshot = (over: Partial<ModuleFullSnapshot> = {}) =>
  ({
    moduleData: { code: "SC1003", title: "Intro to CS", au: "3.0" },
    indexes: { "10001": [], "10002": [] },
    exam: null,
    isCurrentOffering: true,
    isLatestOffering: true,
    year: "2026",
    semester: "2",
    otherSemesters: [{ year: "2025", semester: "1" }],
    prereqNode: null,
    prereqGraph: {},
    related: [],
    knownCodes: [],
    ...over
  }) as unknown as ModuleFullSnapshot

describe("toModuleJson", () => {
  it("returns the public record shape", () => {
    expect(toModuleJson(snapshot())).toEqual({
      code: "SC1003",
      title: "Intro to CS",
      au: 3,
      description: null,
      gradeType: null,
      school: null,
      categories: [],
      prerequisites: [],
      requires: [],
      requiredBy: [],
      mutuallyExclusiveWith: [],
      restrictions: {
        notAvailableToProgramme: null,
        notAvailableToAllProgrammeWith: null,
        notAvailableAsCore: null,
        notAvailableAsPe: null,
        notAvailableAsBdeUe: null
      },
      latestOffering: {
        year: "2026",
        semester: "2",
        isCurrentSemester: true,
        indexCount: 2
      },
      otherSemesters: [{ year: "2025", semester: "1" }],
      exam: null,
      url: "https://ntumods.com/mods/SC1003"
    })
  })

  it("passes prerequisite graph edges, school and restrictions through", () => {
    const json = toModuleJson(
      snapshot({
        moduleData: {
          code: "SC2001",
          title: "Algorithms",
          au: "4.0",
          searchKeys: [],
          faculty: "CSC",
          categories: ["CORE"],
          prerequisite: [["SC1003", "SC1004"]],
          notAvailableAsPeToProgramme: "CS"
        } as ModuleFullSnapshot["moduleData"],
        prereqNode: {
          title: "Algorithms",
          requires: ["SC1003"],
          requiredBy: []
        }
      })
    )
    expect(json).toMatchObject({
      au: 4,
      school: "CSC",
      categories: ["CORE"],
      prerequisites: [["SC1003", "SC1004"]],
      requires: ["SC1003"],
      restrictions: { notAvailableAsPe: "CS" }
    })
  })
})
