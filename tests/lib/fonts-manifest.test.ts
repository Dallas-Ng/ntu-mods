import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import manifest from "@/assets/fonts/manifest.json"
import { describe, expect, it } from "vitest"

import { fontVariants } from "@/config/fonts.mjs"

const dir = path.resolve(__dirname, "../../src/assets/fonts")

const expand = (ranges: string[]) =>
  ranges.flatMap((r) => {
    const [lo, hi = lo] = r.slice(2).split("-")
    const [a, b] = [parseInt(lo, 16), parseInt(hi, 16)]
    return Array.from({ length: b - a + 1 }, (_, i) => a + i)
  })

describe.each(Object.entries(manifest.families))(
  "%s font files",
  (slug, fam) => {
    it("match the manifest (rerun scripts/fonts/subset-fonts.py if not)", () => {
      for (const f of Object.values(fam.files)) {
        const bytes = readFileSync(path.join(dir, f.file))
        expect(bytes.length, f.file).toBe(f.bytes)
        expect(createHash("sha256").update(bytes).digest("hex"), f.file).toBe(
          f.sha256
        )
      }
    })

    it("split the characters between core and extended without overlap", () => {
      const core = expand(fam.files.core.unicodeRange)
      const ext = expand(fam.files.ext.unicodeRange)
      expect(core.length).toBe(fam.files.core.characters)
      expect(ext.length).toBe(fam.files.ext.characters)
      expect(core.filter((c) => ext.includes(c))).toEqual([])
      // Core is what gets preloaded, so it must carry all of ASCII.
      for (let c = 0x20; c <= 0x7e; c++) expect(core).toContain(c)
      expect(ext.some((c) => c < 0x80)).toBe(false)
    })

    it("write every range as U+hex[-hex], with no leading zeros", () => {
      const all = [
        ...fam.files.core.unicodeRange,
        ...fam.files.ext.unicodeRange
      ]
      for (const r of all)
        expect(r).toMatch(/^U\+[1-9A-F][0-9A-F]*(-[1-9A-F][0-9A-F]*)?$/)
    })

    it("list the core file first in the Astro variants", () => {
      const weights = slug === "inter" ? [400, 500, 600, 700] : [400]
      const variants = fontVariants(slug, weights)
      expect(variants).toHaveLength(weights.length * 2)
      const [core, ext] = [fam.files.core, fam.files.ext]
      variants.forEach((v, i) => {
        const f = i < weights.length ? core : ext
        expect(v.src).toEqual([`./src/assets/fonts/${f.file}`])
        expect(v.unicodeRange).toEqual(f.unicodeRange)
        expect(v.weight).toBe(weights[i % weights.length])
        expect(v.style).toBe("normal")
      })
    })
  }
)
