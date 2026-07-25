import { fileURLToPath } from "node:url"

import react from "@astrojs/react"
import vercel from "@astrojs/vercel"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

export default defineConfig({
  // Keeps Astro's special dirs (pages/, layouts/, content.config.ts) out of
  // plain src/ — Next.js auto-detects a top-level src/pages/ as its own Pages
  // Router and refuses to build alongside app/. Shared code (components,
  // hooks, lib, config, state, data, types) stays in src/ for both frameworks
  // via the "@/*" alias below, which is independent of srcDir.
  srcDir: "./src/astro",
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  trailingSlash: "never",
  redirects: {
    "/stars": "/timetable",
    "/mod": "/mods",
    "/help": "/faq"
  },
  vite: {
    // Reuse the same NEXT_PUBLIC_* env vars Next already uses (e.g. the
    // PostHog project token) instead of duplicating them under a PUBLIC_ name.
    envPrefix: ["PUBLIC_", "NEXT_PUBLIC_"],
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    css: {
      // Prevent Vite from picking up the root postcss.config.js (used by the
      // still-running Next.js app's webpack/turbopack pipeline) — Tailwind v4
      // is handled here by the dedicated @tailwindcss/vite plugin instead.
      postcss: {}
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
