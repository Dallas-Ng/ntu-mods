import { describe, expect, it } from "vitest"

import type { AllModule } from "@/types/mods"

import {
  filterModules,
  getGroupKey,
  getGroupLabel,
  groupModules
} from "./filter-modules"

const mod = (overrides: Partial<AllModule> = {}): AllModule => ({
  code: "CZ2001",
  title: "Algorithms",
  au: "3",
  faculty: "CSC",
  categories: ["CORE"],
  isCurrentSemester: true,
  ...overrides
})

const baseOpts = {
  searchTerm: "",
  moduleType: "all",
  moduleFaculty: "all",
  moduleLevel: "all",
  currentOnly: false
}

describe("getGroupKey / getGroupLabel", () => {
  it("groups by level using the 3rd character of the code", () => {
    expect(getGroupKey(mod({ code: "CZ2001" }), "level")).toBe("2")
    expect(getGroupLabel("2", "level")).toBe("Level 2")
  })

  it("groups by the highest-priority category for type", () => {
    expect(getGroupKey(mod({ categories: ["CORE", "GERP"] }), "type")).toBe(
      "GERP"
    )
  })

  it("falls back to OTHER when a module has no categories", () => {
    expect(getGroupKey(mod({ categories: [] }), "type")).toBe("OTHER")
  })
})

describe("groupModules", () => {
  it("buckets modules and sorts level groups numerically", () => {
    const modules = [
      mod({ code: "CZ1001" }),
      mod({ code: "CZ2001" }),
      mod({ code: "CZ0001" })
    ]
    const groups = groupModules(modules, "level")
    expect(groups.map((g) => g.key)).toEqual(["0", "1", "2"])
    expect(groups[0].modules).toHaveLength(1)
  })

  it("sorts non-level/au groupings alphabetically by label", () => {
    const modules = [
      mod({ code: "A", faculty: "EEE" }),
      mod({ code: "B", faculty: "CSC" })
    ]
    const groups = groupModules(modules, "faculty")
    expect(groups.map((g) => g.key)).toEqual(["CSC", "EEE"])
  })
})

describe("filterModules", () => {
  it("filters to current-semester modules only", () => {
    const modules = [
      mod({ code: "A", isCurrentSemester: true }),
      mod({ code: "B", isCurrentSemester: false })
    ]
    const result = filterModules(modules, { ...baseOpts, currentOnly: true })
    expect(result.map((m) => m.code)).toEqual(["A"])
  })

  it("filters by favourites", () => {
    const modules = [mod({ code: "A" }), mod({ code: "B" })]
    const result = filterModules(modules, {
      ...baseOpts,
      favouritesOnly: true,
      favouriteModules: ["B"]
    })
    expect(result.map((m) => m.code)).toEqual(["B"])
  })

  it("filters by module type/faculty/level", () => {
    const modules = [
      mod({ code: "CZ2001", categories: ["CORE"], faculty: "CSC" }),
      mod({ code: "EE2001", categories: ["GERP"], faculty: "EEE" })
    ]
    expect(
      filterModules(modules, { ...baseOpts, moduleType: "GERP" }).map(
        (m) => m.code
      )
    ).toEqual(["EE2001"])
    expect(
      filterModules(modules, { ...baseOpts, moduleFaculty: "CSC" }).map(
        (m) => m.code
      )
    ).toEqual(["CZ2001"])
    expect(
      filterModules(modules, {
        ...baseOpts,
        moduleLevel: "2"
      }).map((m) => m.code)
    ).toEqual(["CZ2001", "EE2001"])
  })

  it("ranks code matches before title matches for a course-code-shaped query", () => {
    const modules = [
      mod({ code: "AB1234", title: "CZ2001 in the description" }),
      mod({ code: "CZ2001", title: "Algorithms" })
    ]
    const result = filterModules(modules, { ...baseOpts, searchTerm: "cz2001" })
    expect(result.map((m) => m.code)).toEqual(["CZ2001", "AB1234"])
  })

  it("matches by title or code for a non-code-shaped query", () => {
    const modules = [
      mod({ code: "CZ2001", title: "Algorithms" }),
      mod({ code: "MH1000", title: "Calculus" })
    ]
    const result = filterModules(modules, {
      ...baseOpts,
      searchTerm: "algorithms"
    })
    expect(result.map((m) => m.code)).toEqual(["CZ2001"])
  })

  it("filters by allowed days, requiring every slot of an index to be on an allowed day", () => {
    const modules = [mod({ code: "A" }), mod({ code: "B" })]
    const indexes = {
      A: { A1: [{ day: 1 }, { day: 3 }] },
      B: { B1: [{ day: 6 }] }
    } as unknown as import("@/hooks/use-season-indexes").SeasonIndexes
    const result = filterModules(modules, {
      ...baseOpts,
      allowedDays: [1, 3],
      indexes
    })
    expect(result.map((m) => m.code)).toEqual(["A"])
  })

  it("keeps a module with no index data when a day/time filter is active", () => {
    const modules = [mod({ code: "A" })]
    const result = filterModules(modules, {
      ...baseOpts,
      allowedDays: [1],
      indexes: {} as import("@/hooks/use-season-indexes").SeasonIndexes
    })
    expect(result.map((m) => m.code)).toEqual(["A"])
  })

  it("filters by time window, requiring every slot of an index to fit inside it", () => {
    const modules = [mod({ code: "A" }), mod({ code: "B" })]
    const indexes = {
      A: { A1: [{ time: "0900-1000" }] },
      B: { B1: [{ time: "0700-0800" }] }
    } as unknown as import("@/hooks/use-season-indexes").SeasonIndexes
    const result = filterModules(modules, {
      ...baseOpts,
      timeStart: 800,
      timeEnd: 1800,
      indexes
    })
    expect(result.map((m) => m.code)).toEqual(["A"])
  })
})
