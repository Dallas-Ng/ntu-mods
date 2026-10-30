# Fonts

Part of [NTUMods](../README.md). Read this before adding a weight, a font feature or a typeface, and before touching `src/assets/fonts/`.

The site has two web fonts: Inter (everything) and Patrick Hand (article thumbnails only). Each is committed as two small files made by a script you run by hand. Nothing about fonts runs in `pnpm build`.

## What ships

| File                                       |  Bytes | Characters | Loaded                                                               |
| ------------------------------------------ | -----: | ---------: | -------------------------------------------------------------------- |
| `src/assets/fonts/inter-core.woff2`        | 19,780 |        107 | Preloaded on every page                                              |
| `src/assets/fonts/inter-ext.woff2`         | 12,568 |        117 | Only when a page contains one of its characters (no built page does) |
| `src/assets/fonts/patrick-hand-core.woff2` |  8,112 |         95 | Preloaded on article pages (`handFont`)                              |
| `src/assets/fonts/patrick-hand-ext.woff2`  |  7,364 |        118 | Only when a thumbnail contains one of its characters (none does)     |

Before the split Inter was one 48,432-byte file on every page and Patrick Hand one 14,224-byte file. `manifest.json` next to the files holds the current sizes, hashes and `unicode-range` of each.

- **Core** is ASCII plus every other character a built page renders: `©` `·` `—` `–` `’` `“` `”` `×` `÷` `−`, and two the browser draws itself, `…` and `•`. The rule is that **no built page downloads the extended file**, which `node scripts/fonts/measure.mjs` checks.
- **Extended** is every other glyph the old `@font-face` served: Latin-1 letters, `€`, `™`, `‹` `›` and so on. It exists so text that is on no built page today (typed by a user, added later) still draws in Inter, as it always did.

Why the core holds more than "the punctuation most pages use":

- Text is shaped one font file at a time, so kerning and contextual alternates do not cross files. `f` + `é` at 30px sits 0.34px further right when `é` comes from the extended file, and Inter's `calt` raises an en dash between digits (`9–21`) only if the dash and the digits are in the same file. Any character on a built page that sat in the extended file changed how its line rendered (measured with pixel diffs: the en dash and `× ÷ −` pages differed, nothing else did).
- Two characters are in no markup. Chromium draws `…` itself for `text-overflow: ellipsis` (Tailwind `truncate`, `line-clamp-*`) whenever a line overflows, including in the wider fallback font before the core file arrives, and `•` for `list-disc` markers. With them in the extended file, 134 pages (11%) downloaded it on a normal load and 200 of 213 sampled pages on a slow one. A scan of the text finds neither.

## How it loads

- `astro.config.mjs` registers each family with Astro's `local` font provider. `src/config/fonts.mjs` builds the variants from `manifest.json`: for every weight, one `@font-face` for the core file and one for the extended file, same family name, each with a `unicode-range` listing only the characters that file contains.
- `BaseLayout` and `MinimalLayout` render `<Font cssVariable>` (the CSS and fallback faces) and `FontPreload` (a `<link rel="preload">` for the core file only). `<Font preload>` is not used because it would preload the extended file too.
- `font-display` and the fallback fonts are as before: `swap` with Astro's generated Arial faces for Inter, `block` and `cursive` for Patrick Hand. Both files are one family, so the generated fallback sits after the whole family in the stack. A character in the extended file draws in the fallback font until that file arrives, exactly as Inter itself does on a first visit.
- Weights stay four separate faces (400, 500, 600, 700), not one `400 700` range, because Astro's fallback faces differ per weight (Arial for 400–600, Arial Bold for 700).

## What was removed, and why nothing visible changes

| Removed                                                                       | Why it is safe                                                                                                                                        |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weights 100–300 from Inter                                                    | The lightest face declared is 400 and nothing sets `font-variation-settings`. Only the low end of the axis goes (see below for the top).              |
| `frac`, `numr`, `dnom`, `pnum`, `locl` (Inter); `frac`, `locl` (Patrick Hand) | Off unless CSS asks, and the site only asks for `tabular-nums`. `locl` only has rules for Catalan; the site is `lang="en"`. Worth 3.1 KB of the core. |
| Five glyphs outside the old `unicode-range` (U+0300, 0301, 0303, 0309, 0323)  | The browser never used them.                                                                                                                          |
| `STAT`, named instances, glyph names, legacy name records                     | Not read by browsers.                                                                                                                                 |
| Hinting                                                                       | Google's files had none (no `fpgm`, `prep`, `cvt`, glyph programs); the script keeps it that way. `gasp` (8 bytes) stays.                             |

Kept on purpose: `calt`, `ccmp`, `kern`, `mark`, `mkmk` (on by default in browsers), `tnum` (Tailwind's `tabular-nums`), `liga` (Patrick Hand), the `wght` axis from 400 to 900, and the copyright and licence name records. No Reserved Font Name is declared by either licence, so no renaming is needed; the script checks and renames automatically if a future source declares one.

Everything the old `@font-face` served is still served. A character that was never in the web font (for example `→`, `Ā`, CJK) still comes from the system font.

### Not done: cutting the weight axis to 400–700

Only 400–700 are ever used, but the top of the axis stays at 900. Cutting it (`axes={"wght": (400, 400, 700)}` in the script) saves 1,216 bytes of the core and 676 of the extended file, and changes rendering: the new end of the axis has to store its deltas in whole font units, which moves glyph edges by up to 2 units in 2048 per em at weights 500, 600 and 700 (never at 400). In Chromium that changed antialiasing on every page of the site (up to 113 levels of 255 on edge pixels in a controlled specimen). Keeping 900 renders pixel-for-pixel like the original. Do it only if that is acceptable; the script then accepts a 2-unit tolerance in its own checks.

## Differences that remain

- Text outside the built pages that puts an extended character next to ASCII (`Café`, `3 × 4` if those were not in the core) loses kerning and contextual alternates at that boundary, by up to a few tenths of a pixel (kerning) or a vertical nudge (alternates).
- A first-time visitor to such text sees the fallback font for those characters until the extended file arrives.

## When to rerun

Run the script when any of these is true, then commit the changed files together:

1. `node scripts/fonts/measure.mjs` (after `pnpm build`) lists a page that downloaded an extended file: a character on that page is not in the core. Find it (`python3 scripts/fonts/subset-fonts.py --audit dist/client` counts characters from the markup; the two the browser draws itself are `…` and `•`), add it to `core_extra` in the script and rerun. `--delay-core 1500` repeats the crawl as a slow connection, which is how the ellipsis case showed up. Keep `--concurrency` at 3 or less: a loaded CPU does the same as a slow connection.
2. A weight outside 400–700, a `font-variation-settings` axis, `font-feature-settings`, or a `font-variant-*` other than `tabular-nums` is added. `frac`, `ss01` and the like are not in the files; the script's `features` and `axes` must change first.
3. The source fonts in `scripts/fonts/source/` are replaced (a new Inter release, say). The sources are the exact files Google Fonts served as the `latin` subset.
4. The script itself changes.

`tests/lib/fonts-manifest.test.ts` fails if the committed files and `manifest.json` disagree.

## Running it

```bash
pip install -r scripts/fonts/requirements.txt        # fonttools, brotli, uharfbuzz
python3 scripts/fonts/subset-fonts.py                # rebuild src/assets/fonts/*
python3 scripts/fonts/subset-fonts.py --check        # exit 1 if the committed files are stale
python3 scripts/fonts/subset-fonts.py --audit dist/client
node scripts/fonts/measure.mjs                       # browser check; needs pnpm build first
```

About a minute. Every run also checks, for each file, that the characters match the intended set and that the `unicode-range` round-trips, then shapes every ordered character pair and a sample of the article text with HarfBuzz at weights 400/500/600/700 (and with `tnum`) against the source font. It requires an exact match and exits non-zero otherwise. Output is byte-for-byte reproducible for a given fontTools version. `measure.mjs` takes `CHROMIUM_PATH` if Playwright's own browser is not installed.

## Later

- Embed the core file in the global stylesheet to drop its request. The stylesheet is inlined into every page here (`inlineStylesheets: "always"`), so a base64 core would add about 26 KB to every HTML response and lose the font's long cache; measure that first.
- Prefetch the extended files when the browser is idle, so the first page that needs one does not wait for it.
