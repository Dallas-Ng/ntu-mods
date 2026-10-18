import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

const memoryStorage = (entries: Record<string, string>) => ({
  getItem: (key: string) => entries[key] ?? null,
  setItem: (key: string, value: string) => {
    entries[key] = value
  },
  removeItem: (key: string) => {
    delete entries[key]
  }
})

describe("useBoundState hydration snapshot", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("renders the defaults, not localStorage, while hydrating", async () => {
    vi.stubGlobal(
      "localStorage",
      memoryStorage({
        "ntu-mods": JSON.stringify({
          state: {
            favouriteModules: ["MH1810"],
            timetables: [{ MH1810: "32058" }, {}, {}, {}, {}]
          },
          version: 2
        })
      })
    )
    vi.resetModules()
    const { useBoundState } = await import("@/state/bound.state")

    // persist has already merged the saved state into the live store...
    expect(useBoundState.getState().favouriteModules).toEqual(["MH1810"])

    // ...but a render using the server snapshot (as hydration does) must
    // match the prerendered HTML, with or without a selector.
    const Bare = () => useBoundState().favouriteModules.join(",") || "none"
    const Selected = () =>
      Object.keys(useBoundState((s) => s.timetables[0])).join(",") || "none"

    expect(renderToString(createElement(Bare))).toBe("none")
    expect(renderToString(createElement(Selected))).toBe("none")
  })
})
