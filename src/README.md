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

No in-between shades such as `text-foreground/70`. Text on a tint is black or the tint's own colour; every text pair in `globals.css` is at least 4.5:1.

Surfaces, all fixed tokens (no `bg-muted/50`-style opacity, except see-through glass: navbar, docs bar, "On this page" button, dialog backdrop):

| Token                                                            | Use                                         |
| ---------------------------------------------------------------- | ------------------------------------------- |
| `background`                                                     | The page                                    |
| `muted`                                                          | Cards (`cardVariants`), inline code, chips  |
| `accent`                                                         | Hover and pressed                           |
| `card` / `popover`                                               | Things that float: dialogs, menus, popovers |
| `primary-subtle`                                                 | Blue callouts, active and selected items    |
| `success`, `warning`, `destructive` (each with a `-subtle` fill) | Status: alerts, changelog tags, API status  |

Borders are for tables (always), form controls, the outline button, floating layers (dialogs, menus, popovers, sticky bars) and dashed drop zones. Everything else (cards, chips, inline code, callouts, alerts, tags, option tiles) has no border and is told apart by its fill. Dividers between rows and sections are fine. No raw Tailwind palette colours (`emerald-500`, `slate-200`) outside the timetable grid, the map and the landing illustrations.

Icons are lucide (stroke 2), sized by context:

| Size     | Use                                                          |
| -------- | ------------------------------------------------------------ |
| `size-3` | Beside 12px text                                             |
| `size-4` | Default: beside 14px text, buttons, menus, icon-only buttons |
| `size-5` | Leading icon of a card, panel or empty state                 |
| `size-6` | Drop zones and landing display only                          |

Icon-only buttons show a grey icon that turns black on hover (navbar, module cards); a state colour (blue for in your timetable, red for a favourite) replaces the grey.

Arrows by meaning: `LinkArrow` (or `TextLink arrow`, or `CardCta` at the foot of a link card) for "go to", `ChevronRight` for opening a row in a list, `ExternalLinkIcon` for leaving the site. Never a typed `→`, `›` or `↗`. Brand logos (`brand-icons.tsx`) keep their own shapes.

Hover, one signal per element:

- Surfaces (cards, rows, menu items, chips, option tiles, icon buttons): background to `accent` (`cardVariants({ interactive: true })` for cards). The text inside does not change colour.
- White controls on a card or other grey surface (`controlOnCard`): stay white, content turns black, a shadow appears. The accent fill is the card's own hover colour, so it would make them vanish.
- Text-only links: `TextLink`. Grey text goes black, black text goes blue, inline links dim.
- Solid buttons (primary, destructive): a slightly darker fill.
- No lift, scale, opacity or border-colour hovers. An arrow in a call to action may nudge (`group-hover:translate-x-0.5`).
- Pointer cursor: every enabled `button`, `[role="button"]` and link gets it from `globals.css`. Do not put `cursor-pointer` on anything that is not clickable. A clickable element that cannot be a `<button>` (it holds another button) gets `role="button"`, `tabIndex={0}` and Enter/Space handling.

The timetable grid and the map keep their own interactions.

Shared pieces for the rest: `TextLink` and `ExternalLinkIcon` (links), `cardVariants` (cards), `InlineCode`, `CopyButton`, `ResponsiveModal` with `modal-parts` and `ConfirmDialog` (dialogs, never `confirm()`), `Alert`, `NewBadge`, and `ArticleToc` / `SideNavDrawer` / `side-nav` styles (side navs).

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
