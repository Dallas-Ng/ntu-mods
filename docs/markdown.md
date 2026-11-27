# Markdown for agents

Append `.md` to the page path. The homepage uses `/index.md`.

| HTML page             | Markdown                 |
| --------------------- | ------------------------ |
| `/`                   | `/index.md`              |
| `/mods`               | `/mods.md`               |
| `/mods/MH1101`        | `/mods/MH1101.md`        |
| `/mods/MH1101/2025/2` | `/mods/MH1101/2025/2.md` |

`pnpm build` writes each prerendered page's Markdown file beside the HTML
in `dist/client`. Cloudflare serves these files directly as static assets.
Historical module pages and modules outside the current catalogue use Astro
endpoints backed by D1. Both paths return `text/markdown; charset=utf-8`.

Publish through the normal site deployment. Requests to the `.md` URLs
need no special headers or Cloudflare rules. Agents can find the convention
in `/llms.txt`.

Generated Markdown uses absolute URLs for local links and images. Links to
exported pages in site navigation use the `.md` path and retain any query
string or fragment. Other links keep their destination path, and external
URLs and code samples are preserved as authored.

HTML pages advertise their Markdown companion with a `rel="alternate"`
link. Markdown frontmatter describes the canonical HTML URL and points to
NTUMods' read-only MCP module search and `/llms.txt`. It uses an article's
published or modified date or a source-backed sitemap date for
`last_updated`. A missing source date is represented as `null`.

The site has no public comments or other user submissions in these exports.
Feedback and browser-local data are not exported. `robots.txt` allows
crawling and declares `search=yes, ai-input=yes, ai-train=no`. Markdown
responses carry the same policy in their `Content-Signal` header.

## Page renderers

`scripts/markdown/pages.mjs` maps routes to exporters. Register new page
layouts here. Pages with the same layout can share an article, policy or
developer-docs renderer. Interactive layouts select the applicable content
or render it from the same data as the HTML.

Use `src/lib/markdown/format.ts` for Markdown tables and escaping, and
`scripts/markdown/html.mjs` for shared transformations of rendered page
content. Static and D1-backed module pages share the same module formatter.

## Serve Markdown at the HTML URL

Once the build is live, add two **URL Rewrite Rules** in the
`ntumods.com` zone. Choose **Custom filter expression** and preserve the
query string for both.

These Free-plan filters match a single media type of `text/markdown` or
`text/plain`. Requests with weighted lists keep their default HTML response.
Both matched media types return `text/markdown; charset=utf-8`. This setup
does not estimate a token count.

For **Markdown for agents – homepage**, use the following filter and set
**Path → Rewrite to → Static** to `/index.md`.

```text
http.host eq "ntumods.com"
and http.request.method in {"GET" "HEAD"}
and lower(trim(http.request.headers["accept"][0])) in {"text/markdown" "text/plain"}
and http.request.uri.path eq "/"
```

For **Markdown for agents – pages**, use the following filter and set
**Path → Rewrite to → Dynamic** to `concat(http.request.uri.path, ".md")`.

```text
http.host eq "ntumods.com"
and http.request.method in {"GET" "HEAD"}
and lower(trim(http.request.headers["accept"][0])) in {"text/markdown" "text/plain"}
and not ends_with(http.request.uri.path, "/")
and not (http.request.uri.path wildcard "*.*")
and not (http.request.uri.path wildcard "/_*")
and not (http.request.uri.path wildcard "/api/*")
and not (http.request.uri.path wildcard "/ingest/*")
and not (http.request.uri.path wildcard "/data/*")
and not (http.request.uri.path wildcard "/mcp/*")
and not http.request.uri.path in {"/mcp" "/stars" "/mod" "/help" "/fgo" "/settings" "/articles/ntu-mods-mcp-server-guide" "/articles/ntu-ai-agents-webmcp-guide"}
```

Add a **Response Header Transform Rule** with **Add static** to append
`Vary: Accept` on both representations. Start with the second rewrite
filter, remove the Accept and trailing-slash checks, and replace each
`http.request.uri.path` with `raw.http.request.uri.path`.

After activation, check the following requests in both orders to verify that
cached HTML and Markdown stay separate.

```sh
curl -fsSI https://ntumods.com/mods
curl -fsSI -H 'Accept: text/markdown' https://ntumods.com/mods
curl -fsSI -H 'Accept: text/plain' https://ntumods.com/mods
```
