import { readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it } from "vitest"

import { getModuleSnapshot } from "@/lib/server/edge/get-module-snapshot"

afterEach(() => {
  delete env.DB
})

describe("historical snapshot canonical URL", () => {
  it("canonicalises equivalent historical offerings to the latest", async () => {
    const db = new DatabaseSync(":memory:")
    try {
      db.exec(
        readFileSync(
          new URL("../../../../db/migrations/0001_init.sql", import.meta.url),
          "utf8"
        )
      )
      db.exec(`
        INSERT INTO semesters (sem, code, year, semester, name, sort_key) VALUES
          ('2024_1', '2024;1', '2024', '1', 'AY2024 Semester 1', 20241),
          ('2025_1', '2025;1', '2025', '1', 'AY2025 Semester 1', 20251);
        INSERT INTO offerings (code, sem, title, description, au, grade_type) VALUES
          ('SC1001', '2024_1', 'Old title', NULL, '3', NULL),
          ('SC1001', '2025_1', 'Computing & Design', NULL, '3', NULL);
      `)
      const prepare = (sql: string) => ({
        first: async () => db.prepare(sql).get() ?? null,
        bind: (...args: string[]) => ({
          first: async () => db.prepare(sql).get(...args) ?? null,
          all: async () => ({ results: db.prepare(sql).all(...args) })
        })
      })
      env.DB = { prepare } as unknown as D1Database

      const changed = await getModuleSnapshot("SC1001", "2024", "1", false)
      expect(changed?.canonicalToLatest).toBe(false)

      db.exec(
        "UPDATE offerings SET title = 'Computing & DESIGN!' WHERE sem = '2024_1'"
      )
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
