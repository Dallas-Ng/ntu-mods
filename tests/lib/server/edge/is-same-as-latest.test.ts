import { DatabaseSync } from "node:sqlite"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MODULE_LATEST_SEM_SQL } from "@/lib/server/db/queries"
import { getModuleSnapshot } from "@/lib/server/edge/get-module-snapshot"

afterEach(() => {
  delete env.DB
})

describe("historical snapshot canonical URL", () => {
  it("compares the latest offering in the snapshot read", async () => {
    const db = new DatabaseSync(":memory:")
    try {
      db.exec(`
        CREATE TABLE semesters (sem TEXT, year TEXT, semester TEXT, sort_key INTEGER);
        CREATE TABLE offerings (code TEXT, sem TEXT, title TEXT, description TEXT, au TEXT, grade_type TEXT);
        INSERT INTO semesters VALUES ('2024_1', '2024', '1', 1), ('2025_1', '2025', '1', 2);
        INSERT INTO offerings VALUES
          ('SC1001', '2024_1', 'Old title', NULL, '3', NULL),
          ('SC1001', '2025_1', 'Computing & Design', NULL, '3', NULL);
      `)
      let title = "Computing and Design"
      const prepare = vi.fn((sql: string) => ({
        first: async () => ({ sem: "2025_1" }),
        bind: (code: string) => ({
          first: async () => {
            if (sql === MODULE_LATEST_SEM_SQL)
              return db.prepare(sql).get(code) ?? null
            if (sql.includes("FROM offerings WHERE code = ? AND sem = ?"))
              return { code, title, au: "3" }
            return null
          },
          all: async () => ({ results: [] })
        })
      }))
      env.DB = { prepare } as unknown as D1Database

      const changed = await getModuleSnapshot("SC1001", "2024", "1", false)
      expect(changed?.canonicalToLatest).toBe(false)
      expect(
        prepare.mock.calls.filter(([sql]) => sql.includes("JOIN semesters"))
      ).toEqual([[MODULE_LATEST_SEM_SQL]])

      title = "Computing & DESIGN!"
      const duplicate = await getModuleSnapshot("SC1001", "2024", "1", false)
      expect(duplicate?.canonicalToLatest).toBe(true)
      expect(duplicate?.isLatestOffering).toBe(false)

      const latest = await getModuleSnapshot("SC1001", "2025", "1", false)
      expect(latest?.canonicalToLatest).toBe(true)
      expect(latest?.isLatestOffering).toBe(true)
    } finally {
      db.close()
    }
  })
})
