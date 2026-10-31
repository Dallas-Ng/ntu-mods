import { env } from "cloudflare:workers"
import { DatabaseSync } from "node:sqlite"
import { afterEach, describe, expect, it, vi } from "vitest"

import { isSameAsLatest } from "@/lib/server/edge/get-module-snapshot"
import type { ModuleSnapshot } from "@/lib/server/edge/get-module-snapshot"

const snapshot = {
  moduleData: { code: "SC1001", title: "Computing", au: "3", searchKeys: [] },
  indexes: {},
  exam: null,
  isCurrentOffering: false,
  isLatestOffering: false
} satisfies ModuleSnapshot

afterEach(() => {
  delete env.DB
})

describe("isSameAsLatest", () => {
  it("compares the latest description without loading its timetable", async () => {
    const first = vi.fn().mockResolvedValue({
      title: "Computing",
      description: null,
      au: "3",
      grade_type: null
    })
    const bind = vi.fn().mockReturnValue({ first })
    const prepare = vi.fn().mockReturnValue({ bind })
    env.DB = { prepare } as unknown as D1Database

    expect(await isSameAsLatest("SC1001", snapshot)).toBe(true)
    expect(bind).toHaveBeenCalledWith("SC1001")
    expect(prepare).toHaveBeenCalledTimes(1)

    first.mockResolvedValueOnce({
      title: "Computing",
      description: "Updated",
      au: "3",
      grade_type: null
    })
    expect(await isSameAsLatest("SC1001", snapshot)).toBe(false)
    first.mockResolvedValueOnce(null)
    expect(await isSameAsLatest("SC1001", snapshot)).toBe(false)
    expect(
      await isSameAsLatest("SC1001", { ...snapshot, isLatestOffering: true })
    ).toBe(false)
    expect(prepare).toHaveBeenCalledTimes(3)
  })

  it("compares against the most recent offering", async () => {
    const db = new DatabaseSync(":memory:")
    try {
      db.exec(`
        CREATE TABLE semesters (sem TEXT, sort_key INTEGER);
        CREATE TABLE offerings (code TEXT, sem TEXT, title TEXT, description TEXT, au TEXT, grade_type TEXT);
        INSERT INTO semesters VALUES ('2024_1', 1), ('2025_1', 2);
        INSERT INTO offerings VALUES
          ('SC1001', '2024_1', 'Old title', NULL, '3', NULL),
          ('SC1001', '2025_1', 'Computing', NULL, '3', NULL);
      `)
      env.DB = {
        prepare: (sql: string) => ({
          bind: (code: string) => ({
            first: async () => db.prepare(sql).get(code) ?? null
          })
        })
      } as unknown as D1Database

      expect(await isSameAsLatest("SC1001", snapshot)).toBe(true)
    } finally {
      db.close()
    }
  })
})
