import { DatabaseSync } from "node:sqlite"
import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it } from "vitest"

import { getModuleIndexes } from "@/lib/server/edge/get-module-snapshot"

afterEach(() => {
  delete env.DB
})

describe("narrow snapshot reads", () => {
  it("returns populated and empty class indexes", async () => {
    const db = new DatabaseSync(":memory:")
    try {
      db.exec(`
        CREATE TABLE class_indexes (code TEXT, sem TEXT, index_key TEXT);
        CREATE TABLE class_slots (code TEXT, sem TEXT, index_key TEXT, slot_no INTEGER, type TEXT, grp TEXT, day INTEGER, time TEXT, venue TEXT, remarks TEXT, duration INTEGER);
        INSERT INTO class_indexes VALUES ('SC1001', '2024_1', '10001'), ('SC1001', '2024_1', '10002');
        INSERT INTO class_slots VALUES ('SC1001', '2024_1', '10001', 0, 'LEC', 'L1', 1, '0830-0920', 'LT1', '', 2);
      `)
      const prepare = (sql: string) => ({
        bind: (...args: string[]) => ({
          all: async () => ({ results: db.prepare(sql).all(...args) })
        })
      })
      env.DB = { prepare } as unknown as D1Database
      const indexes = await getModuleIndexes("SC1001", "2024", "1")
      expect(indexes?.["10001"][0]).toMatchObject({ type: "LEC", venue: "LT1" })
      expect(indexes?.["10002"]).toEqual([])
      expect(await getModuleIndexes("bad!", "2024", "1")).toBeNull()
    } finally {
      db.close()
    }
  })
})
