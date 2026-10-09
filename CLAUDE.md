# ntu-mods

Astro + Cloudflare site for NTU course data. Package manager is **yarn**.

- **Refreshing course data → [AGENTS.md](AGENTS.md).** Read it before touching anything under `scraper/` or `src/data/api/`.
- Scraper internals, per-step flags, data invariants → [scraper/README.md](scraper/README.md)
- **Running `yarn dev` (including in a new worktree) → run `yarn db:seed-local` first.** Dev reads a local D1 under `.wrangler/state`, one per worktree. The `DB` binding is deliberately not `remote: true`: remote dev queries go through a preview-URL proxy behind Cloudflare Access and fail with "Too many redirects". Do not add `remote: true` back and do not turn Access off. Without the seed, D1 routes fail with "no such table: offerings". Re-run it when `src/data/api` changes.
