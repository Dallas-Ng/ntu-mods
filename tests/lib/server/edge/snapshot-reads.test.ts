import { DatabaseSync } from "node:sqlite"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getModuleIndexes,
  getModuleSnapshot
} from "@/lib/server/edge/get-module-snapshot"

afterEach(() => {
  delete env.DB
})

describe("narrow snapshot reads", () => {
  it("skips prerequisites and programme keys for historical page rendering", async () => {
    const queries: string[] = []
    env.DB = {
      prepare: (sql: string) => {
        queries.push(sql)
        return {
          bind: () => ({
            first: async () =>
              sql.includes("SELECT * FROM offerings")
                ? {
                    code: "SC1001",
                    sem: "2024_1",
                    title: "Computing",
                    au: "3",
                    faculty: null,
                    categories: null
                  }
                : sql.includes("FROM semesters")
                  ? { sem: "2025_1" }
                  : null,
            all: async () => ({ results: [] })
          }),
          first: async () => ({ sem: "2025_1" })
        }
      }
    } as unknown as D1Database
    const result = await getModuleSnapshot(
      new URL("https://example.com"),
      "SC1001",
      "2024",
      "1",
      false
    )
    expect(result?.moduleData.title).toBe("Computing")
    expect(queries.some((sql) => sql.includes("FROM prerequisites"))).toBe(
      false
    )
    expect(queries.some((sql) => sql.includes("offering_programmes"))).toBe(
      false
    )
  })

  it("loads only index keys and slots, including empty indexes", async () => {
    const db = new DatabaseSync(":memory:")
    try {
      db.exec(`
        CREATE TABLE class_indexes (code TEXT, sem TEXT, index_key TEXT);
        CREATE TABLE class_slots (code TEXT, sem TEXT, index_key TEXT, slot_no INTEGER, type TEXT, grp TEXT, day INTEGER, time TEXT, venue TEXT, remarks TEXT, duration INTEGER);
        INSERT INTO class_indexes VALUES ('SC1001', '2024_1', '10001'), ('SC1001', '2024_1', '10002');
        INSERT INTO class_slots VALUES ('SC1001', '2024_1', '10001', 0, 'LEC', 'L1', 1, '0830-0920', 'LT1', '', 2);
      `)
      const prepare = vi.fn((sql: string) => ({
        bind: (...args: string[]) => ({
          all: async () => ({ results: db.prepare(sql).all(...args) })
        })
      }))
      env.DB = { prepare } as unknown as D1Database
      const indexes = await getModuleIndexes("SC1001", "2024", "1")
      expect(indexes?.["10001"][0]).toMatchObject({ type: "LEC", venue: "LT1" })
      expect(indexes?.["10002"]).toEqual([])
      expect(prepare).toHaveBeenCalledTimes(2)
      expect(await getModuleIndexes("bad!", "2024", "1")).toBeNull()
      expect(prepare).toHaveBeenCalledTimes(2)
    } finally {
      db.close()
    }
  })
})
