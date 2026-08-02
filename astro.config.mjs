import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import cloudflare from "@astrojs/cloudflare"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"

// Cloudflare Workers Builds checks out the real repo (not a tarball), so this
// resolves there too — baked in at build time so a deployed worker's bundle
// always carries the commit it was built from, for prod debugging.
const GIT_COMMIT_SHA = (() => {
  try {
    return execSync("git rev-parse --short=10 HEAD").toString().trim()
  } catch {
    return "unknown"
  }
})()

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
  // Replaces next/font's Inter. Same deal: downloaded and self-hosted at build
  // time, so there's no render-blocking request to fonts.googleapis.com and no
  // third-party origin in the critical path. Wired to Tailwind's --font-sans in
  // src/styles/globals.css.
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      subsets: ["latin"],
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"]
    }
  ],
  trailingSlash: "never",
  // "file" emits /faq.html, not /faq/index.html. Cloudflare's asset server
  // serves a directory-style build at /faq/ and 307s /faq to it — so with the
  // default format every canonical, sitemap and internal URL (all slashless)
  // would cost a redirect hop before rendering. "file" serves them directly.
  build: { format: "file" },
  // 301, not Astro's shorthand default of 302 — these were `permanent: true`
  // redirects under Next, and demoting them would drop the accumulated link
  // equity on /stars in particular.
  redirects: {
    "/stars": { status: 301, destination: "/timetable" },
    "/mod": { status: 301, destination: "/mods" },
    "/help": { status: 301, destination: "/faq" }
  },
  vite: {
    envPrefix: ["PUBLIC_"],
    define: {
      "import.meta.env.PUBLIC_GIT_COMMIT_SHA": JSON.stringify(GIT_COMMIT_SHA)
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    // client:only islands are hydrated via Astro's own runtime import calls,
    // which esbuild's dependency scanner can't see statically. Without this,
    // vite discovers these deps lazily on first mount and re-optimizes mid-
    // session — the reload can leave two live React module instances in the
    // page (mismatched hook contexts -> "Invalid hook call").
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "posthog-js",
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "radix-ui",
        "sonner",
        "tailwind-merge",
        "vaul",
        "zustand",
        "zustand/middleware"
      ]
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
