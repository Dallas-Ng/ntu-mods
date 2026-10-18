// @vitest-environment jsdom
import { act, createElement } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const memoryStorage = (entries: Record<string, string>) => ({
  getItem: (key: string) => entries[key] ?? null,
  setItem: (key: string, value: string) => {
    entries[key] = value
  },
  removeItem: (key: string) => {
    delete entries[key]
  }
})

// Imports the store fresh against a localStorage holding a saved plan.
const loadSeededStore = async () => {
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
  return import("@/state/bound.state")
}

describe("useBoundState hydration snapshot", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("renders the defaults, not localStorage, while hydrating", async () => {
    const { useBoundState } = await loadSeededStore()

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

  it("hydrates without a mismatch, then shows the saved state", async () => {
    const { useBoundState } = await loadSeededStore()
    const Favourites = () =>
      useBoundState((s) => s.favouriteModules).join(",") || "none"

    const container = document.createElement("div")
    container.innerHTML = renderToString(createElement(Favourites))
    expect(container.textContent).toBe("none")

    const errors: unknown[] = []
    await act(async () => {
      hydrateRoot(container, createElement(Favourites), {
        onRecoverableError: (error) => errors.push(error)
      })
    })

    expect(errors).toEqual([])
    expect(container.textContent).toBe("MH1810")
  })
})
