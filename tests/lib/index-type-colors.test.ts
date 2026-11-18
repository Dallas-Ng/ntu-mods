import { describe, expect, it } from "vitest"

import { withAppearanceDefaults } from "@/config/appearance-settings"
import {
  getActiveOverride,
  getEffectiveOverride,
  getIndexTypeVars,
  getModuleCellVars,
  getPaletteHex,
  hexToTint,
  hslTokenToHex,
  mergeTypeOverride,
  tintToken
} from "@/lib/index-type-colors"

describe("hexToTint", () => {
  it("reads the hue and saturation of a picked colour", () => {
    expect(hexToTint("#ff0000")).toEqual({ hue: 0, saturation: 100 })
    expect(hexToTint("#0000ff")).toEqual({ hue: 240, saturation: 100 })
  })

  it("keeps a grey grey", () => {
    expect(hexToTint("#ffffff")).toEqual({ hue: 0, saturation: 0 })
    expect(hexToTint("#808080")).toEqual({ hue: 0, saturation: 0 })
  })

  it("accepts shorthand and a missing hash", () => {
    expect(hexToTint("f00")).toEqual({ hue: 0, saturation: 100 })
    expect(hexToTint("#0f0")).toEqual({ hue: 120, saturation: 100 })
  })

  it("returns null for anything that is not a hex colour", () => {
    expect(hexToTint("rebeccapurple")).toBeNull()
    expect(hexToTint("#12345")).toBeNull()
  })
})

describe("hslTokenToHex", () => {
  it("turns a palette token into a hex colour", () => {
    expect(hslTokenToHex("0 100% 50%")).toBe("#ff0000")
    expect(hslTokenToHex("120 100% 25%")).toBe("#008000")
  })

  it("round-trips a palette token's hue and saturation", () => {
    const tint = hexToTint(hslTokenToHex("174 72% 88%"))

    // Hex only has 8 bits per channel, so allow a rounding step.
    expect(tint?.hue).toBeGreaterThanOrEqual(173)
    expect(tint?.hue).toBeLessThanOrEqual(176)
    expect(tint?.saturation).toBeGreaterThanOrEqual(70)
    expect(tint?.saturation).toBeLessThanOrEqual(73)
  })

  it("does not throw on a token it cannot read", () => {
    expect(hslTokenToHex("not-a-colour")).toBe("#000000")
  })
})

describe("tintToken", () => {
  it("takes the picked hue and saturation and keeps the palette lightness", () => {
    expect(tintToken("84 70% 88%", { hue: 199, saturation: 89 })).toBe(
      "199 89% 88%"
    )
  })

  it("wraps hues outside a single turn", () => {
    expect(tintToken("10 50% 50%", { hue: 370, saturation: 50 })).toBe(
      "10 50% 50%"
    )
    expect(tintToken("10 50% 50%", { hue: -10, saturation: 50 })).toBe(
      "350 50% 50%"
    )
  })

  it("clamps saturation and leaves a token it cannot read alone", () => {
    expect(tintToken("10 50% 50%", { hue: 10, saturation: 140 })).toBe(
      "10 100% 50%"
    )
    expect(tintToken("nope", { hue: 10, saturation: 50 })).toBe("nope")
  })
})

describe("mergeTypeOverride", () => {
  it("lets a module win field by field over the type default", () => {
    expect(
      mergeTypeOverride({ color: "#ff0000", opacity: 50 }, { opacity: 20 })
    ).toEqual({ color: "#ff0000", opacity: 20 })
  })

  it("returns nothing when neither level sets anything", () => {
    expect(mergeTypeOverride()).toBeUndefined()
  })
})

describe("getEffectiveOverride", () => {
  const appearance = withAppearanceDefaults({
    timetableStyle: "classic",
    granularColors: true,
    typeOverrides: { lec: { color: "#ff0000", opacity: 50 } },
    moduleOverrides: { AB1501: { lec: { opacity: 20 } } }
  })

  it("lets a module's own setting win over the app-wide type", () => {
    expect(getEffectiveOverride(appearance, "lec", "AB1501")).toEqual({
      color: "#ff0000",
      opacity: 20
    })
  })

  it("falls back to the type value for a module without its own", () => {
    expect(getEffectiveOverride(appearance, "lec", "CZ2002")).toEqual({
      color: "#ff0000",
      opacity: 50
    })
  })

  it("returns the app-wide value when no module is named", () => {
    expect(getEffectiveOverride(appearance, "lec")).toEqual({
      color: "#ff0000",
      opacity: 50
    })
  })

  it("returns nothing for a type that is untouched", () => {
    expect(getEffectiveOverride(appearance, "tut")).toBeUndefined()
  })
})

describe("getActiveOverride", () => {
  const off = withAppearanceDefaults({
    timetableStyle: "classic",
    typeOverrides: { lec: { color: "#ff0000" } },
    moduleOverrides: { AB1501: { lec: { opacity: 20 } } }
  })
  const on = withAppearanceDefaults({ ...off, granularColors: true })

  it("ignores saved overrides while granular control is off", () => {
    expect(getActiveOverride(off, "lec")).toBeUndefined()
    expect(getActiveOverride(off, "lec", "AB1501")).toBeUndefined()
  })

  it("applies them once granular control is on", () => {
    expect(getActiveOverride(on, "lec", "AB1501")).toEqual({
      color: "#ff0000",
      opacity: 20
    })
  })
})

describe("getPaletteHex", () => {
  it("matches the palette token it comes from", () => {
    const hex = getPaletteHex("classic", "lec")
    const tint = hexToTint(hex)

    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(tint?.hue).toBeGreaterThanOrEqual(173)
    expect(tint?.hue).toBeLessThanOrEqual(176)
    expect(tint?.saturation).toBeGreaterThanOrEqual(70)
    expect(tint?.saturation).toBeLessThanOrEqual(73)
  })
})

describe("getIndexTypeVars", () => {
  it("draws the palette unchanged", () => {
    const vars = getIndexTypeVars("classic", "lec")

    expect(vars["--index-lec-bg"]).toBe("174 72% 88%")
    expect(vars["--index-lec-text"]).toBe("174 72% 26%")
    expect(vars["--index-lec-border"]).toBe("174 72% 40%")
  })

  it("recolours every token of the type and keeps each lightness", () => {
    const vars = getIndexTypeVars("classic", "lab", { color: "#ff0000" })

    expect(vars["--index-lab-bg"]).toBe("0 100% 88%")
    expect(vars["--index-lab-text"]).toBe("0 100% 24%")
    expect(vars["--index-lab-border"]).toBe("0 100% 38%")
  })

  it("keeps a grey pick grey", () => {
    expect(
      getIndexTypeVars("classic", "lec", { color: "#808080" })["--index-lec-bg"]
    ).toBe("0 0% 88%")
  })

  it("writes colours only, because the cell fades as a whole block", () => {
    const vars = getIndexTypeVars("classic", "lec", {
      color: "#ff0000",
      opacity: 20
    })

    expect(Object.keys(vars).every((name) => !name.endsWith("-alpha"))).toBe(
      true
    )
    expect(vars["--index-lec-bg"]).toBe("0 100% 88%")
  })

  it("ignores a colour it cannot read", () => {
    expect(
      getIndexTypeVars("classic", "lec", { color: "nope" })["--index-lec-bg"]
    ).toBe("174 72% 88%")
  })
})

describe("getModuleCellVars", () => {
  it("stays off while granular control is off", () => {
    const appearance = withAppearanceDefaults({
      timetableStyle: "classic",
      moduleOverrides: { AB1501: { lec: { color: "#ff0000" } } }
    })

    expect(getModuleCellVars(appearance, "AB1501", "lec")).toBeUndefined()
  })

  it("re-tints the module's own blocks", () => {
    const appearance = withAppearanceDefaults({
      timetableStyle: "classic",
      granularColors: true,
      moduleOverrides: { AB1501: { lec: { color: "#ff0000" } } }
    })

    expect(
      getModuleCellVars(appearance, "AB1501", "lec")?.["--index-lec-bg"]
    ).toBe("0 100% 88%")
  })

  it("layers a module's opacity over the type's own colour", () => {
    const appearance = withAppearanceDefaults({
      timetableStyle: "classic",
      granularColors: true,
      typeOverrides: { lec: { color: "#0000ff" } },
      moduleOverrides: { AB1501: { lec: { opacity: 25 } } }
    })

    expect(
      getModuleCellVars(appearance, "AB1501", "lec")?.["--index-lec-bg"]
    ).toBe("240 100% 88%")
  })

  it("has nothing for a type the module does not override", () => {
    const appearance = withAppearanceDefaults({
      timetableStyle: "classic",
      granularColors: true,
      moduleOverrides: { AB1501: { lec: { color: "#ff0000" } } }
    })

    expect(getModuleCellVars(appearance, "AB1501", "tut")).toBeUndefined()
  })
})
