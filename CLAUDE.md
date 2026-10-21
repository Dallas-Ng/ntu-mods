# ntu-mods

Astro + Cloudflare site for NTU course data. Package manager is **pnpm**.

- **Refreshing course data → [AGENTS.md](AGENTS.md).** Read it before touching anything under `scraper/` or `src/data/api/`.
- Scraper internals, per-step flags, data invariants → [scraper/README.md](scraper/README.md)
- **Running `pnpm dev` (including in a new worktree) → run `pnpm db:seed-local` first.** Dev reads a local D1 under `.wrangler/state`, one per worktree (`remoteBindings: false` in `astro.config.mjs`). Do not remove it: `wrangler.jsonc` marks `DB` as `remote: true`, and the remote dev proxy runs on the preview-URL hostname behind Cloudflare Access, so queries fail with "Too many redirects". Do not turn Access off. Without the seed, D1 routes fail with "no such table: offerings". Re-run it when `src/data/api` changes.
