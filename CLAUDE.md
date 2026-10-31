# ntu-mods

Astro + Cloudflare site for NTU course data. Package manager is **pnpm**.

- **Refreshing course data → [AGENTS.md](AGENTS.md).** Read it before touching anything under `scraper/` or `src/data/api/`.
- **Changing anything visible (components, styles, copy) → read [docs/design.md](docs/design.md) first** and follow it. Update it in the same change if a rule must change.
- Docs index: [README.md](README.md) (orientation and map), [docs/architecture.md](docs/architecture.md) (system overview and design decisions), [docs/design.md](docs/design.md) (UI and copy rules), [docs/fonts.md](docs/fonts.md) (the two-file font subsets and the script that makes them), [src/README.md](src/README.md) (code layout, rendering model, analytics), [db/README.md](db/README.md) (data consumption, `db:*` scripts), [docs/mcp.md](docs/mcp.md) (the public MCP server: tools, limits, kill switch), [docs/deployment.md](docs/deployment.md), [docs/maintenance.md](docs/maintenance.md)
- Scraper internals, per-step flags, data invariants → [scraper/README.md](scraper/README.md)
- **Running `pnpm dev` (including in a new worktree) → run `pnpm db:seed-local` first.** Dev reads a local D1 under `.wrangler/state`, one per worktree (`remoteBindings: false` in `astro.config.mjs`). Do not remove it: `wrangler.jsonc` marks `DB` as `remote: true`, and the remote dev proxy runs on the preview-URL hostname behind Cloudflare Access, so queries fail with "Too many redirects". Do not turn Access off. Without the seed, D1 routes fail with "no such table: offerings". Re-run it when `src/data/api` changes.
