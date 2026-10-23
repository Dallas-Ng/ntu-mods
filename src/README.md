# src

Part of [NTUMods](../README.md). System overview: [docs/architecture.md](../docs/architecture.md). Course data and database: [db/README.md](../db/README.md). Deployment: [docs/deployment.md](../docs/deployment.md).

Site code. Astro's special directories live under `src/astro/` (via `srcDir` in [`astro.config.mjs`](../astro.config.mjs)). Everything shared (`components/`, `hooks/`, `lib/`, `state/`) stays here and is imported through the `@/*` alias.

```
astro/
  pages/        Routes: .astro pages and API endpoints (mods, timetable, share, screenshot, api, ingest)
  layouts/      Base and minimal page shells
  middleware.ts Module-code case normalisation
components/     React islands and shared UI
data/api/       Committed course JSON (see ../db/README.md)
hooks/          React hooks
lib/            Utilities and server helpers
  server/db/    json-source.ts (build-time reads) + D1 query layer
  server/edge/  On-demand routes: D1 binding, no fs
state/          Zustand stores
types/          Global types
```

## Type and colour

Five text sizes, each with one job:

| Size             | Use                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| 30px `text-3xl`  | Page title, through `Header` only                                                                                  |
| 20px `text-xl`   | Section heading: `SectionHeading`                                                                                  |
| 16px `text-base` | Sub-heading and card title (`SectionHeading as="h3"`), the line under a page title, article text, inputs on phones |
| 14px `text-sm`   | Default: body text, descriptions, buttons, navigation, table cells, form labels                                    |
| 12px `text-xs`   | Secondary details only: hints under a field, captions, dates, counts, uppercase labels                             |

No other sizes, except the timetable grid (and its miniature previews), the campus map and `NewBadge`, whose space is fixed. The landing page's display headings are also exempt.

Two text colours:

- `text-foreground` (black, white in dark mode): what people read. Headings, body text, FAQ answers, legal text, values, labels, the active nav item.
- `text-muted-foreground` (grey): what supports it. The line under a title, card descriptions, hints, captions, dates and counts, inactive nav items, icons.

No in-between shades such as `text-foreground/70`.

Shared pieces for the rest: `TextLink` and `ExternalLinkIcon` (links), `CopyButton`, `ResponsiveModal` with `modal-parts` and `ConfirmDialog` (dialogs, never `confirm()`), `Alert`, `NewBadge`, and `ArticleToc` / `SideNavDrawer` / `side-nav` styles (side navs).

## Rendering model

Cloudflare Workers has no filesystem, so every route is prerendered at build time (plain Node, via the adapter's `prerenderEnvironment`) except:

| Route                         | Why on-demand                                             |
| ----------------------------- | --------------------------------------------------------- |
| `/mods/:code/:year/:semester` | ~28k combinations; prerendering dominated build time      |
| `/api/feedback`               | Sends mail through Resend at request time                 |
| `/mcp`                        | MCP server (POST only); see [docs/mcp.md](../docs/mcp.md) |
| `/ingest/*`                   | PostHog reverse proxy                                     |

On-demand routes must not import `lib/server/db/repo.ts` (or `json-source.ts` beneath it): both use `node:fs`, unavailable in Workers. Use `lib/server/edge/*`, which queries the D1 binding.

## Analytics

PostHog, through the `/ingest` proxy. Every custom event goes through `track()` in [`lib/analytics.ts`](lib/analytics.ts), which only accepts names listed in [`lib/analytics-events.ts`](lib/analytics-events.ts). To add an event, add its name to that list, then call `track("name", { ...props })`. No personal data in properties. Caught errors go through `reportError(feature, error)`.

The landing page is mostly static, so one delegated click listener in `astro/pages/index.astro` sends `landing_link_clicked` with the link's `href`.
