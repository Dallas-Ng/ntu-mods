# MCP server

Part of [NTU Mods](../README.md). System overview: [architecture.md](architecture.md). Deployment and the kill switch: [deployment.md](deployment.md#mcp-server).

A public, read-only [MCP](https://modelcontextprotocol.io) server at `https://ntumods.com/mcp`. Students add it as a custom connector in Claude or ChatGPT, and developers add it to Claude Code or Cursor. It serves the same public course data as the REST API and open data files. There is no sign-in and no key. User-facing docs live at `/developers/mcp`.

## What it exposes

| Tool                 | Returns                                                                 | Source                                                                                     | D1 queries                                              |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `list_semesters`     | Every semester with data, and which is current                          | `src/data/api/semesters.json`, bundled                                                     | 0                                                       |
| `search_modules`     | Code, title, AU, school, categories and last offered semester per match | `/data/api/modules.json` via `env.ASSETS`                                                  | 0                                                       |
| `get_module`         | The full module record, the same JSON as `GET /api/modules/{code}`      | D1 via `getLatestModuleSnapshot`, behind `getKnownCodes` and `caches.default`              | About 12 on a cold miss, 0 when cached                  |
| `get_module_indexes` | Every class index of one module in one semester, with timeslots         | Latest semester: `/data/api/indexes/{sem}.json`. Older: D1 via `getModuleSnapshot`, cached | Latest: 0. Older: about 7 on a cold miss, 0 when cached |
| `get_exam`           | Exam date, time and duration for one module in a semester               | `/data/api/exams/{sem}.json` via `env.ASSETS`                                              | 0                                                       |
| `list_exams`         | Exams in a semester, filtered by text and date                          | `/data/api/exams/{sem}.json` via `env.ASSETS`                                              | 0                                                       |

**Not exposed:** anything that needs the user's browser state (timetables, plans, favourites, generation settings, CGPA, share links), anything that navigates or writes, raw SQL and bulk export. Bulk users download `/data/api/*.json`. The browser-only tools are WebMCP tools, documented at `/developers/webmcp`.

## One source for tools and docs

The tools are WebMCP tools picked by name, so there is one description and input schema per tool:

- `src/lib/webmcp/definitions.ts` holds the names, descriptions and JSON Schema inputs.
- `src/lib/mcp/tools.ts` picks the six that make sense on a server (`MCP_TOOL_NAMES`, `MCP_TOOLS`).
- `src/lib/server/mcp/server.ts` registers exactly `MCP_TOOLS`, and `/developers/mcp` renders its tool table from them (`src/lib/developers/mcp-docs.ts`).

To change a tool, edit its definition and its handler in `src/lib/server/mcp/handlers.ts`. To add one, also add its name to `MCP_TOOL_NAMES`. The shared pure code (`toModuleJson`, `searchModuleList`, `filterExams`, `describeSlot`, `normaliseDate`) lives in `src/lib/module-json.ts` and `src/lib/mcp/shared.ts`, so the REST route, the browser tools and `/mcp` return the same shapes. The one difference is that `/mcp` links modules with absolute URLs.

## How it works

- **Route:** `src/astro/pages/mcp.ts` (`prerender = false`, `ALL`, so `GET` and `DELETE` get a proper 405). The ordered checks live in `src/lib/server/mcp/endpoint.ts`.
- **Transport:** stateless Streamable HTTP through the SDK's `createMcpHandler`. No sessions and no Durable Objects. 2026-07-28 clients get one JSON body. 2025-era clients that start with `initialize` are served statelessly from the same factory, and the SDK answers them with a one-event SSE stream that it closes after the reply.
- **SDK:** `@modelcontextprotocol/server` v2, pinned. Not v1, whose `zod ^3.25 || ^4` peer would force a site-wide zod upgrade (the repo pins 3.22). v2 brings its own zod. Tool inputs stay plain JSON Schema through `fromJsonSchema`, and the Cloudflare build bundles the SDK's Workers-safe validator (no `eval`). Re-run `e2e/mcp.spec.ts` on every SDK upgrade.
- **Assets are fetched with the request's own origin.** The dev server refuses other hosts, so `mcp.ts` records the origin per request.

### Memory

A Workers isolate has 128 MB, and parsed JSON takes several times its file size.

| File                        | Size                        | Held in memory           | Why                                                                            |
| --------------------------- | --------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `modules.json`              | 1.1 MB                      | Always, once per isolate | Every `search_modules` call needs all of it.                                   |
| Latest `indexes/{sem}.json` | About 1.2 MB                | Always, once per isolate | Almost every `get_module_indexes` call is for the current semester.            |
| Older `indexes/{sem}.json`  | About 1.2 MB each, 46 files | Never                    | A caller cycling semesters would force a parse per call. They read D1 instead. |
| `exams/{sem}.json`          | 16 to 60 KB, 252 KB for all | Each on first use        | Small enough to keep every semester.                                           |

The handlers are created once per isolate and memoise one promise per file. A failed load is dropped so the next call retries. D1 results (`get_module`, older indexes) go through `caches.default` under a synthetic key with `ON_DEMAND_CACHE_CONTROL`, and a missing offering is cached too.

## Abuse and cost

With no sign-in there is no user to count, and IP addresses are a poor stand-in: connector calls come from Anthropic and OpenAI servers, and students on NTU Wi-Fi share campus NAT addresses. So the defence is to make every call cheap and bounded.

**There is no per-session limit.** The 2026-07-28 MCP spec removed `Mcp-Session-Id` and the `initialize` handshake, stateless mode issues no session id, and a caller could mint a new one anyway.

Checks run cheapest first, and each rejects before any later work:

| #   | Check                                                                         | Rejects with        |
| --- | ----------------------------------------------------------------------------- | ------------------- |
| 0   | Kill switch: the `MCP_DISABLED` secret is set                                 | 503 + `Retry-After` |
| 1   | Method is `POST`                                                              | 405                 |
| 2   | `Content-Type: application/json`, declared body at most 16 KB                 | 415 / 413           |
| 3   | Origin check (`isCrossSite`), required by the spec against DNS rebinding      | 403                 |
| 4   | Per-IP flood ceiling `MCP_LIMITER`, 3000 a minute                             | 429 + `Retry-After` |
| 5   | Body read with a 16 KB cap even with no declared length, one JSON-RPC message | 413 / 400           |
| 6   | Input validation (`src/lib/mcp/validate.ts`)                                  | Tool error          |
| 7   | Output caps: 100 modules, 200 exams, one module per indexes call              | none                |

- **The ceiling is high on purpose** so a vendor egress IP or the campus NAT is not throttled. It stops one machine from flooding, nothing more. Rate limit bindings count per Cloudflare location.
- **D1 work is bounded per real module.** Unknown codes stop at `getKnownCodes` with no query. Known codes hit D1 at most once per module (and semester, for indexes) per cache period per location. This is the same bound the public REST route and `/mods/:code/:year/:semester` have.
- **Semester input is checked against `semesters.json`** before it becomes part of an asset path or a query.
- **A flood costs requests and log events, not D1 work.** Watch Workers usage.
- **Prompt injection:** module text comes from NTU. The `get_module` description says it is data, and every tool is `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`.
- **Logging:** one line per call, `{ tool, status, ms, client }`. `client` is the MCP client name from the request `_meta`, else the first User-Agent product, cut to 40 characters. Never log arguments: search queries are free text. No PostHog events from this route.

### Kill switch

Set the `MCP_DISABLED` secret to any value and `/mcp` answers 503 on the next request. It is a secret, so deploys keep it, and it needs no build and no paid plan. Commands and the dashboard path are in [deployment.md](deployment.md#mcp-server). Remove the secret to turn the server back on.

A Cloudflare WAF rule is not a better switch here. WAF rate rules count per data center, never globally, and on the Free plan they can only count by IP with a 10 second window.

## Tests

- `tests/lib/mcp/`: the tool list, input validation, shared helpers.
- `tests/lib/module-json.test.ts`: pins the module JSON shape shared with the REST route.
- `tests/lib/server/mcp/handlers.test.ts`: every tool with stubbed I/O, including cache and memoisation behaviour.
- `tests/lib/server/mcp/route.test.ts`: every request check, both protocol eras through the real SDK, the kill switch and the logging rules. `cloudflare:workers` is aliased to `tests/stubs/cloudflare-workers.ts` in `vitest.config.ts`.
- `e2e/mcp.spec.ts`: a real `tools/list` and `tools/call` against the running worker, and `/developers/mcp` listing the same tools.

## Known risks and open items

- **No per-user limit.** A determined caller can use up to 3000 calls a minute per IP per location. Cost per call is bounded, so this is a billing risk, not an outage risk. The kill switch and billing alerts are the backstop.
- **Shared vendor IPs.** If one vendor sends most traffic through few IPs, the ceiling could throttle real students. Watch 429s by `client` and raise the limit if needed.
- **Campus NAT on the existing site.** `MODULE_API_LIMITER` and `WALK_LIMITER` allow 60 requests a minute per IP, so many students behind NTU's NAT share that budget. Check the logs for 429s from `155.69.0.0/16`.
- **Data freshness.** `DB` and `src/data/api` are published separately, so `get_module` and older-semester indexes can briefly disagree with the static tools after a data refresh. Each response carries its semester.
- **Client support churn.** Support for ChatGPT plans is unclear (OpenAI's help page lists Business and Enterprise/Edu; Plus and Pro are inconsistently documented), and some clients may still speak only the 2025 protocol. The docs tell people to check their plan.
- **No `ai-catalog.json` entry.** The AI Catalog type for MCP is `application/mcp-server-card+json`, and its `url` points at a server card document, not at the endpoint. Add an entry once a server card route exists.
- **Not verified:** that all campus traffic leaves from `155.69.0.0/16`, and real-client behaviour in Claude (Free and Pro), ChatGPT developer mode, Claude Code and Cursor. Test each before announcing changes.
