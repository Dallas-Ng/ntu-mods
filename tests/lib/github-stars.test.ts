import { describe, expect, it } from "vitest"

import { readStarCount, repoPath } from "@/components/developers/github-stars"

describe("repoPath", () => {
  it("turns a repository URL into the API path", () => {
    expect(repoPath("https://github.com/Dallas-Ng/ntu-mods")).toBe(
      "Dallas-Ng/ntu-mods"
    )
  })

  it("ignores a trailing slash", () => {
    expect(repoPath("https://github.com/Dallas-Ng/ntu-mods/")).toBe(
      "Dallas-Ng/ntu-mods"
    )
  })
})

describe("readStarCount", () => {
  it("reads the count from a GitHub repository payload", () => {
    expect(readStarCount({ stargazers_count: 1138 })).toBe(1138)
  })

  it("accepts zero stars", () => {
    expect(readStarCount({ stargazers_count: 0 })).toBe(0)
  })

  it("returns undefined when the payload has no usable count", () => {
    expect(readStarCount({})).toBeUndefined()
    expect(readStarCount({ stargazers_count: "1138" })).toBeUndefined()
    expect(readStarCount(null)).toBeUndefined()
    expect(readStarCount(undefined)).toBeUndefined()
  })
})
