import { fileURLToPath } from "node:url"

import cloudflare from "@astrojs/cloudflare"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

export default defineConfig({
  srcDir: "./src/astro",
  output: "server",
  // Cloudflare Workers have no runtime filesystem, so every route must be
  // prerender = true except /api/feedback and /ingest/* (fetch()/posthog-node
  // only, no fs). prerenderEnvironment: "node" keeps *build-time* static
  // generation running in plain Node (where all the fs-based data readers in
  // src/lib/server/*.ts still work) instead of Cloudflare's workerd runtime,
  // which has no fs at all — even at build time, by default.
  adapter: cloudflare({
    imageService: "passthrough",
    prerenderEnvironment: "node"
  }),
  integrations: [react()],
  trailingSlash: "never",
  redirects: {
    "/stars": "/timetable",
    "/mod": "/mods",
    "/help": "/faq"
  },
  vite: {
    envPrefix: ["PUBLIC_"],
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          // Astro's default client output is one chunk per component/hook —
          // dozens of sub-1KB files per page, each costing a full request.
          // Bundle third-party deps and shared first-party building blocks
          // (shadcn/ui primitives, hooks, lib, state) into a few cacheable
          // chunks instead of one file per module.
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("@mlc-ai/web-llm")) return "vendor-webllm"
              return "vendor"
            }
            if (id.includes("/src/components/ui/")) return "ui"
            if (id.includes("/src/hooks/")) return "hooks"
            if (id.includes("/src/state/")) return "state"
            if (id.includes("/src/lib/")) return "lib"
          }
        }
      }
    }
  }
})
