# Contributing to ntu-mods

Thank you for helping. Contributions of every size are welcome, and you do not need to be an NTU student. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- For anything beyond a small fix, open an [issue](https://github.com/Dallas-Ng/ntu-mods/issues/new/choose) first so we can agree on the approach.
- Orientation: [README.md](README.md), [docs/architecture.md](docs/architecture.md) and [src/README.md](src/README.md).

## Set up

The package manager is **pnpm**. Use the Node version in [.node-version](.node-version).

```bash
pnpm install
pnpm db:seed-local
pnpm dev
```

`pnpm db:seed-local` builds a local D1 database under `.wrangler/state`. Run it before `pnpm dev`, and again whenever `src/data/api` changes. You do not need a Cloudflare account or any secrets to run the site.

## Make a change

1. Fork the repository and branch from `main`, for example `feat/my-feature`.
2. Keep the change focused. Small, single-purpose pull requests are reviewed fastest.
3. Run the checks:

   ```bash
   pnpm lint
   pnpm test
   pnpm test:e2e
   ```

   `pnpm test:e2e` needs a prior `pnpm build`. CI runs the same checks on every pull request.

4. Open a pull request against `main` and fill in the template.

Pull requests are squash-merged. The `E2E SEO tests (Playwright)` check must pass and the branch must be up to date with `main`.

## Course data

Do not edit files under `src/data/api/` or `scraper/` by hand. Course data is refreshed by the maintainer, see [AGENTS.md](AGENTS.md). If you spot wrong data, open an issue with the course code and semester.

## Previews

Preview deployments are served behind Cloudflare Access and are only available to the maintainer. Pull requests from forks may not get one, so describe visual changes in the pull request and attach a screenshot.

## Security

Do not report vulnerabilities in a public issue. See [SECURITY.md](SECURITY.md).
