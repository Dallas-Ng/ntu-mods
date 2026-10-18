"use client"

import { useEffect } from "react"

import { registerTools } from "@/lib/webmcp/core"
import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"

/**
 * Exposes the site to in-browser AI agents through WebMCP. Mounted on every
 * page; renders nothing, and does nothing when the browser has no WebMCP.
 * The handlers load lazily, so browsers without WebMCP never download them.
 */
const WebMcpProvider = () => {
  useEffect(() => {
    let cleanup = () => {}
    let cancelled = false

    // Bail before fetching the handlers when there is nothing to register on.
    const supported = "modelContext" in document || "modelContext" in navigator
    if (!supported) return

    import("@/lib/webmcp/handlers").then(({ webMcpHandlers }) => {
      if (cancelled) return
      cleanup = registerTools(
        WEBMCP_TOOLS,
        webMcpHandlers,
        window.location.pathname
      )
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return null
}

export default WebMcpProvider
