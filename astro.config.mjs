import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import cloudflare from "@astrojs/cloudflare"
import { satteri } from "@astrojs/markdown-satteri"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders, sessionDrivers } from "astro/config"

import hastFigure from "./src/lib/hast-figure.mjs"

// Claude Code worktrees (.claude/worktrees/*) symlink node_modules back to the
// main checkout instead of a duplicate install — Vite's dev server otherwise
// refuses to serve files outside its project root, which the symlink target
// resolves to. Widening fs.allow to every worktree root (main included) fixes
// dev in any of them without hardcoding a path.
const WORKTREE_ROOTS = (() => {
  try {
    return execSync("git worktree list")
      .toString()
      .trim()
      .split("\n")
      .map((line) => line.split(" ")[0])
  } catch {
    return []
  }
})()

// Same WORKERS_CI/CF_PAGES signal used in scripts/indexnow.mjs to detect a
// real Cloudflare deploy vs a local `yarn build` — not the commit's git
// branch or any account/zone info, just "was this built by CI".
const BUILD_ENV =
  process.env.WORKERS_CI === "1" || process.env.CF_PAGES === "1"
    ? "ci"
    : "local"

export default defineConfig({
  srcDir: "./src/astro",
  output: "server",
  // Cloudflare Workers have no runtime filesystem, so every route must be
  // prerender = true except /api/feedback and /ingest/* (fetch()/posthog-node
  // only, no fs). prerenderEnvironment: "node" keeps *build-time* static
  // generation running in plain Node (where all the fs-based data readers in
  // src/lib/server/*.ts still work) instead of Cloudflare's workerd runtime,
  // which has no fs at all — even at build time, by default.
  //
  // remoteBindings: false keeps `astro dev` off wrangler's remote proxy
  // session. wrangler.jsonc marks the D1 binding remote:true, but that session
  // is a preview-hostname worker, which Cloudflare Access (enabled on Preview
  // URLs) bounces in a redirect loop: "Too many redirects. http://d1/query".
  // Dev reads a local D1 instead — seed it with `yarn db:seed-local`.
  adapter: cloudflare({
    imageService: "passthrough",
    prerenderEnvironment: "node",
    remoteBindings: false
  }),
  // Nothing in this app calls Astro.session — without an explicit driver,
  // the Cloudflare adapter auto-provisions a "SESSION" KV binding with no
  // id, which Cloudflare deploys reject once that dashboard-linked
  // namespace is gone (deploy error 10210). memory() satisfies the
  // adapter's session requirement without needing any KV namespace at all.
  session: { driver: sessionDrivers.memory() },
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
  // Article images get a <figure>/<figcaption> and a dark-mode twin
  // (src/lib/hast-figure.mjs). Sätteri is Astro's default Markdown processor;
  // it is named here only to attach the plugin.
  markdown: { processor: satteri({ hastPlugins: [hastFigure] }) },
  // Hover-triggered prefetch of same-origin links — pairs with the long
  // edge/browser Cache-Control on prerendered pages (public/_headers), so
  // prefetched navigations are cheap cache hits, not fresh renders.
  prefetch: { defaultStrategy: "hover" },
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
    "/help": { status: 301, destination: "/faq" },
    "/fgo": { status: 301, destination: "/tools/fgo-optimiser" }
  },
  vite: {
    server: { fs: { allow: [".", ...WORKTREE_ROOTS] } },
    envPrefix: ["PUBLIC_"],
    define: {
      "import.meta.env.PUBLIC_BUILD_ENV": JSON.stringify(BUILD_ENV)
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
        "@hookform/resolvers/zod",
        "class-variance-authority",
        "clsx",
        "cmdk",
        "date-fns",
        "ics",
        "lucide-react",
        "pdfjs-dist",
        "photoswipe",
        "radix-ui",
        "react-hook-form",
        "sonner",
        "tailwind-merge",
        "vaul",
        "zod",
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
              // One catch-all vendor chunk meant every page downloaded every
              // dependency (pdfjs, posthog, zod...) even when it used one.
              // Split the heavy ones so a page only pulls what it imports.
              const pkg =
                /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(
                  id
                )?.[1]
              if (pkg === "react" || pkg === "react-dom" || pkg === "scheduler")
                return "vendor-react"
              if (pkg === "posthog-js") return "vendor-posthog"
              if (pkg === "pdfjs-dist") return "vendor-pdfjs"
              if (pkg === "photoswipe") return "vendor-photoswipe"
              if (pkg === "date-fns") return "vendor-date-fns"
              if (
                pkg === "zod" ||
                pkg === "react-hook-form" ||
                pkg === "@hookform/resolvers"
              )
                return "vendor-forms"
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
