import { describe, expect, it } from "vitest"

import {
  DEFAULT_GENERATION_CONFIG,
  isDefaultGenerationConfig
} from "./generation-config"

describe("isDefaultGenerationConfig", () => {
  it("is true for the default config", () => {
    expect(isDefaultGenerationConfig(DEFAULT_GENERATION_CONFIG)).toBe(true)
  })

  it("is false when a scalar field is changed", () => {
    expect(
      isDefaultGenerationConfig({
        ...DEFAULT_GENERATION_CONFIG,
        maxConsecutiveSlots: 4
      })
    ).toBe(false)
  })

  it("is false when a collection field is non-empty", () => {
    expect(
      isDefaultGenerationConfig({
        ...DEFAULT_GENERATION_CONFIG,
        lunchBreaks: [{ day: 1, startTime: 1200, endTime: 1300 }]
      })
    ).toBe(false)
  })

  it("is false when a collisionIgnoreTypes entry is non-empty", () => {
    expect(
      isDefaultGenerationConfig({
        ...DEFAULT_GENERATION_CONFIG,
        collisionIgnoreTypes: { A: ["TUT"] }
      })
    ).toBe(false)
  })
})
