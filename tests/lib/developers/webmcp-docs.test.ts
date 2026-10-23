import { describe, expect, it } from "vitest"

import { webmcpGroups } from "@/lib/developers/webmcp-docs"
import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"

describe("WebMCP docs groups", () => {
  it("lists every registered tool exactly once", () => {
    const listed = webmcpGroups.flatMap((g) => g.tools.map((t) => t.name))
    expect(listed.sort()).toEqual(WEBMCP_TOOLS.map((t) => t.name).sort())
  })
})
