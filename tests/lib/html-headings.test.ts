import { describe, expect, it } from "vitest"

import { htmlHeadings } from "@/lib/html-headings"

describe("htmlHeadings", () => {
  it("lists h2s with ids, without the anchor link or other tags", () => {
    const html = `<h2 id="files" class="x">The <b>files</b><a href="#files" class="heading-anchor">#</a></h2>
      <h2>No id</h2><h3 id="sub">Sub</h3>`
    expect(htmlHeadings(html)).toEqual([
      { id: "files", depth: 2, text: "The files" }
    ])
  })

  it("decodes the apostrophes Astro and React write, and decodes once", () => {
    const html = `<h2 id="a">What&#39;s new</h2><h2 id="b">What&#x27;s in a record</h2><h2 id="c">Use &amp;lt;br&amp;gt; &amp; more</h2>`
    expect(htmlHeadings(html).map((h) => h.text)).toEqual([
      "What's new",
      "What's in a record",
      "Use &lt;br&gt; & more"
    ])
  })
})
