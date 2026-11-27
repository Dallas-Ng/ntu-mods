// @vitest-environment jsdom
import { readFileSync } from "node:fs"
import path from "node:path"

import { act, createElement } from "react"
import { createRoot } from "react-dom/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const source = readFileSync(
  path.resolve(__dirname, "../../src/astro/components/TranslationGuard.astro"),
  "utf8"
)
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1]

const { removeChild, insertBefore } = Node.prototype

beforeAll(() => {
  if (!script) throw new Error("inline script not found")
  new Function(script)()
})

afterAll(() => {
  Node.prototype.removeChild = removeChild
  Node.prototype.insertBefore = insertBefore
})

// What Google Translate does: swap a text node for <font><font>…</font></font>.
function translate(text: Text) {
  const outer = document.createElement("font")
  const inner = document.createElement("font")
  inner.textContent = `translated ${text.data}`
  outer.appendChild(inner)
  text.parentNode!.replaceChild(outer, text)
  return outer
}

describe("TranslationGuard", () => {
  it("ignores removing a text node a translator detached (#387)", () => {
    const div = document.createElement("div")
    const text = document.createTextNode("hello")
    div.appendChild(text)
    translate(text)
    expect(div.removeChild(text)).toBe(text)
  })

  it("removes a node a translator wrapped where it actually is", () => {
    const div = document.createElement("div")
    const span = document.createElement("span")
    const wrapper = document.createElement("font")
    div.appendChild(wrapper)
    wrapper.appendChild(span)
    expect(div.removeChild(span)).toBe(span)
    expect(span.parentNode).toBeNull()
  })

  it("inserts before the wrapper when the reference was wrapped", () => {
    const div = document.createElement("div")
    const ref = document.createElement("span")
    const wrapper = document.createElement("font")
    div.append(document.createElement("i"), wrapper)
    wrapper.appendChild(ref)
    const node = document.createElement("b")
    div.insertBefore(node, ref)
    expect(div.children[1]).toBe(node)
    expect(div.children[2]).toBe(wrapper)
  })

  it("appends when the reference was detached", () => {
    const div = document.createElement("div")
    const text = document.createTextNode("hello")
    div.appendChild(text)
    translate(text)
    const node = document.createElement("b")
    div.insertBefore(node, text)
    expect(div.lastChild).toBe(node)
  })

  it("still behaves normally for untouched nodes", () => {
    const div = document.createElement("div")
    const a = document.createElement("a")
    const b = document.createElement("b")
    div.appendChild(b)
    div.insertBefore(a, b)
    expect([...div.childNodes]).toEqual([a, b])
    div.insertBefore(document.createElement("i"), null)
    expect(div.childNodes).toHaveLength(3)
    expect(div.removeChild(a)).toBe(a)
  })

  it("keeps a React tree alive after its text is translated", async () => {
    ;(
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    const view = (show: boolean) =>
      createElement("p", null, "Results: ", show ? "found" : null)
    await act(async () => root.render(view(true)))
    const p = container.querySelector("p")!
    // Snapshot first: translate() replaces nodes in the live childNodes list.
    const texts = Array.from(p.childNodes) as Text[]
    texts.forEach(translate)
    await act(async () => root.render(view(false)))
    await act(async () => root.render(view(true)))
    expect(container.querySelector("p")).toBe(p)
    expect(p.textContent).toContain("found")
    await act(async () => root.unmount())
    container.remove()
  })

  it("still throws for a node that belongs elsewhere", () => {
    const div = document.createElement("div")
    const other = document.createElement("div")
    const child = document.createElement("span")
    other.appendChild(child)
    expect(() => div.removeChild(child)).toThrow()
    expect(() => div.insertBefore(document.createElement("b"), child)).toThrow()
  })
})
