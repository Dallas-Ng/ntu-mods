#!/usr/bin/env python3
"""Split each web font into a small core file and an extended file.

Run by hand, never from `pnpm build`. The output is committed.

    python3 scripts/fonts/subset-fonts.py             # rebuild src/assets/fonts/*
    python3 scripts/fonts/subset-fonts.py --check     # exit 1 if the committed files are stale
    python3 scripts/fonts/subset-fonts.py --audit dist/client   # which characters each page needs

Input is the exact file Google Fonts served before the split (its `latin`
subset), kept in scripts/fonts/source/ with its licence, so a rerun needs no
network. Output, per family:

  <slug>-core.woff2  ASCII plus the few other characters that most pages show.
                     Preloaded on every page that uses the family.
  <slug>-ext.woff2   Every other glyph the old @font-face served. Behind
                     `unicode-range`: the browser only downloads it when a page
                     contains one of its characters.
  manifest.json      Sizes, hashes and the unicode-range of each file.
                     astro.config.mjs reads it, so ranges can never drift from
                     the files.

What is removed, and why rendering stays identical: see docs/fonts.md.
Setup: pip install -r scripts/fonts/requirements.txt
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

try:
    import uharfbuzz as hb
    from fontTools import __version__ as FONTTOOLS_VERSION
    from fontTools import subset
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
except ImportError as e:  # pragma: no cover
    sys.exit(f"{e}\nInstall the tools first: pip install -r scripts/fonts/requirements.txt")

ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "scripts/fonts/source"
OUT_DIR = ROOT / "src/assets/fonts"

# The unicode-range of the @font-face rules Google generated for the `latin`
# subset. Both families used it. A character outside this range was never drawn
# by these fonts (the browser skipped them), so it is not "served" and stays out
# even when the file happens to hold a glyph for it (e.g. U+0300).
SERVED_RANGE = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,"
    "U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
    "U+FEFF,U+FFFD"
)
# Control characters have no glyph to draw. Leaving them out of the ranges
# keeps a stray CR or NUL from triggering a download.
NEVER_DRAWN = {0x0000, 0x000D}

ASCII = set(range(0x20, 0x7F))
# The weights the site declares and uses (font-weight 400/500/600/700; the
# typography plugin's 800/900/bolder have always resolved to the 700 face).
SITE_WEIGHTS = (400, 500, 600, 700)


@dataclass
class Family:
    slug: str
    name: str
    source: str
    licence: str
    # Axis limits as (min, default, max). Empty for a static font.
    axes: dict[str, tuple[int, int, int]] = field(default_factory=dict)
    # OpenType features to keep. Everything else is removed from GSUB/GPOS.
    features: tuple[str, ...] = ()
    # Characters beyond ASCII that go in the core file because most pages show them.
    core_extra: tuple[int, ...] = ()


FAMILIES = [
    Family(
        slug="inter",
        name="Inter",
        source="Inter-latin-wght.woff2",
        licence="OFL-Inter.txt",
        # Weights below 400 are never used (the lightest face declared is 400), so
        # the low end of the axis goes. The top stays at 900 on purpose: cutting it
        # to 700 would save ~1 KB per page, but the new end-point must store its
        # deltas in whole font units, which moves glyph edges by up to half a unit
        # at 500/600/700 and changes antialiasing on every page (measured:
        # docs/fonts.md). Use (400, 400, 700) only if that is approved.
        axes={"wght": (400, 400, 900)},
        # calt, ccmp, kern, mark, mkmk are on by default in browsers. tnum is
        # switched on by Tailwind's `tabular-nums`. Not kept: frac/numr/dnom
        # (never requested), pnum (never requested; Inter's digits are
        # proportional anyway) and locl (only has rules for Catalan; the site is
        # lang="en").
        features=("calt", "ccmp", "kern", "mark", "mkmk", "tnum"),
        # Rule: every non-ASCII character a built page renders is in the core, so no
        # built page downloads the extended file (`node scripts/fonts/measure.mjs`
        # must list none) and no line of text on one straddles two files. Kerning
        # and contextual alternates do not cross files: `f` + `é` at 30px sits
        # 0.34px further right once `é` comes from the extended file.
        # Found with a browser crawl, not by reading text (docs/fonts.md):
        #   ©  footer, every page.   ·  97% of pages.   —  74%.   ’ “ ”  articles.
        #   –  16 pages.   ×  ÷  −  the CGPA articles.
        #   …  in no markup: Chromium draws it for `text-overflow: ellipsis`
        #      (`truncate`, `line-clamp-*`) whenever a line overflows, which includes
        #      the wider fallback font before the core file lands. Left out, 200 of
        #      213 pages fetched the extended file on a slow load.
        #   •  in no markup either: the `list-disc` marker glyph.
        # Add a character here when a new page makes measure.mjs list it.
        core_extra=(
            0x00A9, 0x00B7, 0x2014, 0x2013, 0x2019, 0x201C, 0x201D,
            0x2026, 0x2022, 0x00D7, 0x00F7, 0x2212,
        ),  # fmt: skip
    ),
    Family(
        slug="patrick-hand",
        name="Patrick Hand",
        source="PatrickHand-Regular-latin.woff2",
        licence="OFL-PatrickHand.txt",
        # liga is on by default. frac and locl (Catalan only) are never used.
        features=("liga",),
        # Only draws article thumbnail text, which is ASCII.
    ),
]


# --------------------------------------------------------------------------
# ranges
# --------------------------------------------------------------------------


def parse_ranges(value: str) -> set[int]:
    out: set[int] = set()
    for part in value.split(","):
        part = part.strip().removeprefix("U+")
        lo, _, hi = part.partition("-")
        out.update(range(int(lo, 16), int(hi or lo, 16) + 1))
    return out


def to_ranges(cps: set[int]) -> list[str]:
    out, run = [], []
    for cp in sorted(cps):
        if run and cp == run[-1] + 1:
            run.append(cp)
            continue
        if run:
            out.append(run)
        run = [cp]
    if run:
        out.append(run)
    # No leading zeros: the ranges are inlined into every page's HTML.
    return [f"U+{r[0]:X}" if len(r) == 1 else f"U+{r[0]:X}-{r[-1]:X}" for r in out]


# --------------------------------------------------------------------------
# build
# --------------------------------------------------------------------------


def served_codepoints(fam: Family) -> set[int]:
    cmap = TTFont(SOURCE_DIR / fam.source).getBestCmap()
    return (set(cmap) & parse_ranges(SERVED_RANGE)) - NEVER_DRAWN


def split(fam: Family) -> tuple[set[int], set[int]]:
    served = served_codepoints(fam)
    core = (ASCII | set(fam.core_extra)) & served
    return core, served - core


def declares_reserved_name(fam: Family, font: TTFont) -> bool:
    """True if the licence or the font's own name table reserves a font name."""
    texts = [r.toUnicode() for r in font["name"].names if r.nameID in (0, 13)]
    licence = (SOURCE_DIR / fam.licence).read_text(encoding="utf8")
    # The reservation is declared in the copyright notice above the licence text.
    texts.append(licence.split("This Font Software is licensed", 1)[0])
    return any(re.search(r"with Reserved Font Names?\b", t, re.I) for t in texts)


def rename(font: TTFont, suffix: str) -> None:
    """OFL 1.1 section 3: a modified version may not use a Reserved Font Name."""
    compact = suffix.replace(" ", "")
    for rec in font["name"].names:
        text = rec.toUnicode()
        if rec.nameID in (1, 4, 16):
            rec.string = f"{text} {suffix}"
        elif rec.nameID in (3, 6):
            head, sep, tail = text.partition("-")
            rec.string = f"{head}{compact}{sep}{tail}" if sep else f"{text}{compact}"


def build(fam: Family, cps: set[int], force_rename: bool = False) -> bytes:
    # recalcBBoxes=False: Patrick Hand's glyph headers hold bounding boxes that
    # differ from the outlines by a unit in 52 glyphs, and the rasteriser places a
    # glyph with them. Rewriting them would shift those glyphs.
    font = TTFont(SOURCE_DIR / fam.source, recalcBBoxes=False, recalcTimestamp=False)
    reserved = declares_reserved_name(fam, font)
    opts = subset.Options()
    opts.layout_features = list(fam.features)
    opts.hinting = False  # no instructions to keep; also makes a rerun on a hinted source safe
    opts.glyph_names = False  # post format 3
    opts.legacy_kern = False
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # copyright and licence stay; see the OFL
    opts.name_legacy = False
    opts.name_languages = [0x409]
    opts.notdef_outline = False
    opts.drop_tables += ["STAT"]
    opts.recalc_timestamp = False  # byte-identical output on every run
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=cps)
    sub.subset(font)
    if fam.axes:
        # After subsetting: the instancer drops empty gvar entries, which the
        # subsetter then trips over.
        font["fvar"].instances = []
        instancer.instantiateVariableFont(font, dict(fam.axes), inplace=True)
    if reserved or force_rename:
        rename(font, "Subset")
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    return buf.getvalue()


# --------------------------------------------------------------------------
# verification
# --------------------------------------------------------------------------


# Cutting the *top* of an axis makes the new end-point store whole-unit deltas,
# so outlines, advances and mark anchors can move by a unit or two (1/1024 em).
# Cutting only the low end, or nothing, must be exact.
TOLERANCE_ROUNDED = 2.0


def outline(glyphset, name: str):
    pen = DecomposingRecordingPen(glyphset)
    glyphset[name].draw(pen)
    ops = tuple(op for op, _ in pen.value)
    pts = tuple(c for _, args in pen.value for pt in args if isinstance(pt, tuple) for c in pt)
    return glyphset[name].width, ops, pts


class Shaper:
    """Shapes text with HarfBuzz and reduces each glyph to what is drawn."""

    def __init__(self, data: bytes, weight: int | None):
        self.tt = TTFont(io.BytesIO(data))
        # HarfBuzz cannot read WOFF2, so give it the same font as plain sfnt.
        sfnt = io.BytesIO()
        self.tt.flavor = None
        self.tt.save(sfnt)
        self.hb = hb.Font(hb.Face(sfnt.getvalue()))
        loc = {"wght": weight} if weight and "fvar" in self.tt else {}
        if loc:
            self.hb.set_variations(loc)
        self.gs = self.tt.getGlyphSet(location=loc or None)
        self.order = self.tt.getGlyphOrder()
        self.cache: dict[int, tuple] = {}

    def sig(self, gid: int):
        if gid not in self.cache:
            self.cache[gid] = outline(self.gs, self.order[gid])
        return self.cache[gid]

    def shape(self, text: str, tnum: bool = False):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        buf.language = "en"
        hb.shape(self.hb, buf, {"tnum": True} if tnum else {})
        runs = [
            (i.cluster, self.sig(i.codepoint), p.x_advance, p.x_offset, p.y_offset)
            for i, p in zip(buf.glyph_infos, buf.glyph_positions)
        ]
        # HarfBuzz swaps invisible characters (ZWSP, soft hyphen, BOM) for the font's
        # space glyph, or deletes them if it has none. Neither draws anything.
        return [g for g in runs if g[2] or g[1][1]]


def compare(a, b) -> float | None:
    """Largest deviation between two shaped runs in font units, or None if they differ in kind."""
    if len(a) != len(b):
        return None
    worst = 0.0
    for (_, (_, oa, pa), *ra), (_, (_, ob, pb), *rb) in zip(a, b):
        if oa != ob or len(pa) != len(pb):
            return None
        worst = max(worst, *(abs(x - y) for x, y in zip(pa, pb)), *(abs(x - y) for x, y in zip(ra, rb)))
    return worst


def probe_strings(cps: set[int], fam: Family) -> list[str]:
    chars = [chr(c) for c in sorted(cps)]
    out = [a + b for a in chars for b in chars]
    if cps >= ASCII:
        out += [
            "10:30", "9:00-11:00", "3x4", "2 x 3", "a->b", "<-", "=>", "(A)", "[1]",
            "1/2", "12:34:56", "-->", "a-b", "A.B", "8:30 AM", "AV To Ty", "WAVE",
            "SC1004: Intro", "CGPA 4.50", "100%", "e.g.", "Q&A", "#1", "@home",
        ]  # fmt: skip
        # Real prose, so contextual rules see real neighbours.
        for md in sorted((ROOT / "content").glob("**/*.md")):
            for line in md.read_text(encoding="utf8").splitlines():
                run = "".join(c if ord(c) in cps else " " for c in line)[:200].strip()
                if len(run) > 3:
                    out.append(run)
    return out


def narrowed_top(fam: Family) -> bool:
    if not fam.axes:
        return False
    source = {a.axisTag: a.maxValue for a in TTFont(SOURCE_DIR / fam.source)["fvar"].axes}
    return any(hi < source[tag] for tag, (_, _, hi) in fam.axes.items())


def check_parity(fam: Family, produced: dict[str, tuple[set[int], bytes]]) -> tuple[list[str], dict[int | None, float]]:
    """Every shaped run must pick the same glyphs and draw them the same, within the tolerance."""
    problems: list[str] = []
    worst: dict[int | None, float] = {}
    src = (SOURCE_DIR / fam.source).read_bytes()
    weights = SITE_WEIGHTS if fam.axes else (None,)
    for kind, (cps, data) in produced.items():
        for w in weights:
            a, b = Shaper(src, w), Shaper(data, w)
            tolerance = TOLERANCE_ROUNDED if narrowed_top(fam) else 0.0
            for tnum in (False, True) if "tnum" in fam.features else (False,):
                bad = 0
                for text in probe_strings(cps, fam):
                    d = compare(a.shape(text, tnum), b.shape(text, tnum))
                    if d is not None:
                        worst[w] = max(worst.get(w, 0.0), d)
                    if d is None or d > tolerance:
                        bad += 1
                        if bad <= 3:
                            problems.append(f"{fam.slug}-{kind} wght={w} tnum={tnum}: shaping differs for {text!r}")
                if bad > 3:
                    problems.append(f"{fam.slug}-{kind} wght={w} tnum={tnum}: {bad} strings differ in total")
    return problems, worst


def check_structure(fam: Family, produced: dict[str, tuple[set[int], bytes]]) -> list[str]:
    problems: list[str] = []
    served = served_codepoints(fam)
    seen: set[int] = set()
    for kind, (cps, data) in produced.items():
        font = TTFont(io.BytesIO(data))
        cmap = set(font.getBestCmap())
        label = f"{fam.slug}-{kind}"
        if cmap != cps:
            problems.append(f"{label}: cmap differs from the intended set by {sorted(cmap ^ cps)[:8]}")
        if parse_ranges(",".join(to_ranges(cmap))) != cmap:
            problems.append(f"{label}: unicode-range does not round-trip")
        if seen & cmap:
            problems.append(f"{label}: overlaps the other file at {sorted(seen & cmap)[:8]}")
        seen |= cmap
        for tag in ("fpgm", "prep", "cvt ", "hdmx", "STAT"):
            if tag in font:
                problems.append(f"{label}: still has {tag!r}")
        for tag in ("GSUB", "GPOS"):
            if tag in font:
                tags = {r.FeatureTag for r in font[tag].table.FeatureList.FeatureRecord}
                if tags - set(fam.features):
                    problems.append(f"{label}: {tag} still has {sorted(tags - set(fam.features))}")
        if fam.axes:
            got = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in font["fvar"].axes}
            if got != {k: tuple(map(float, v)) for k, v in fam.axes.items()}:
                problems.append(f"{label}: axes are {got}")
    if seen != served:
        problems.append(f"{fam.slug}: files cover {len(seen)} characters, the old @font-face served {len(served)}")
    return problems


def boundary_kerning(fam: Family, core: set[int], ext: set[int], used: set[int]) -> list[str]:
    """Adjacent pairs that now sit in different files and so cannot kern or form a contextual alternate."""
    src = (SOURCE_DIR / fam.source).read_bytes()
    sh = Shaper(src, 400 if fam.axes else None)
    lone = {c: sh.shape(chr(c)) for c in core | ext}
    hits = []
    for e in sorted(ext & used):
        for c in sorted(core):
            for a, b in ((c, e), (e, c)):
                joined = sh.shape(chr(a) + chr(b))
                apart = lone[a] + [(1, *g[1:]) for g in lone[b]]
                if compare(joined, apart) != 0:
                    hits.append(f"{chr(a)}{chr(b)}")
    return hits


# --------------------------------------------------------------------------
# what the content uses
# --------------------------------------------------------------------------


def used_characters() -> set[int]:
    """Every non-ASCII character in the content, source and data that can reach a screen."""
    paths = [*(ROOT / "content").glob("**/*"), *(ROOT / "src").glob("**/*"), *(ROOT / "public").glob("**/*")]
    wanted = {".md", ".mdx", ".ts", ".tsx", ".astro", ".css", ".json", ".svg", ".txt"}
    out: set[int] = set()
    for p in paths:
        if p.suffix in wanted and p.is_file():
            out.update(ord(c) for c in p.read_text(encoding="utf8", errors="ignore") if ord(c) > 0x7F)
    return out


class _Page(HTMLParser):
    SKIP = {"script", "style", "noscript", "template"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        self.skip += tag in self.SKIP
        self.text += [v for k, v in attrs if k in ("alt", "title", "aria-label", "placeholder") and v]

    def handle_endtag(self, tag):
        self.skip = max(0, self.skip - (tag in self.SKIP))

    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)


def audit(dist: Path, families: list[Family]) -> None:
    """Page frequency of every non-ASCII character in a built site, against what each file holds."""
    pages = sorted(dist.glob("**/*.html"))
    count: dict[int, int] = {}
    ellipsis = bullets = 0
    for p in pages:
        html = p.read_text(encoding="utf8")
        body = html.split("<body", 1)[-1]
        ellipsis += bool(re.search(r"\b(truncate|text-ellipsis|line-clamp-\d)\b", body))
        bullets += bool(re.search(r"\blist-disc\b|class=\"[^\"]*\bprose\b[^\"]*\"[\s\S]*<ul", body))
        parser = _Page()
        parser.feed(html)
        chars = {ord(c) for c in "".join(parser.text) if ord(c) > 0x7F}
        # Generated content and quotes live in the inlined CSS, not the markup.
        for css in re.findall(r"<style[^>]*>(.*?)</style>", html, re.S):
            for m in re.findall(r"(?:content|quotes)\s*:\s*([^;}]*)", css):
                m = re.sub(r"\\([0-9a-fA-F]{1,6})\s?", lambda g: chr(int(g.group(1), 16)), m)
                chars |= {ord(c) for c in m if ord(c) > 0x7F}
        for c in chars:
            count[c] = count.get(c, 0) + 1
    inter = families[0]
    core, ext = split(inter)
    generated = [(0x2026, "ellipsis from truncate / line-clamp", ellipsis), (0x2022, "bullet from list-disc / prose lists", bullets)]
    generated_cps = {g[0] for g in generated}
    print(f"{len(pages)} pages in {dist}.\n")
    print("char  code    pages     %   where it is drawn today")
    for cp, n in sorted(count.items(), key=lambda kv: -kv[1]):
        where = "core" if cp in core else "ext" if cp in ext else "system font (never in the web font)"
        flag = ""
        if cp in ext and n / len(pages) >= 0.016:
            flag = "   <- worth moving to core_extra"
        if cp in core and cp not in ASCII and n / len(pages) < 0.016 and cp not in generated_cps:
            flag = "   <- on few pages: drop from core_extra"
        print(f" {chr(cp):<3} U+{cp:04X} {n:>6} {100 * n / len(pages):>5.0f}%   {where}{flag}")
    print("\nDrawn by the browser, not in the markup (static guess; a browser run is the real answer):")
    for cp, label, n in generated:
        print(f" {chr(cp):<3} U+{cp:04X} {n:>6} {100 * n / len(pages):>5.0f}%   {label}   {'core' if cp in core else 'ext'}")
    print("\nThe exact check is a browser crawl: node scripts/fonts/measure.mjs (docs/fonts.md).")


# --------------------------------------------------------------------------


def run(check_only: bool, force_rename: bool) -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict = {"tool": {"fonttools": FONTTOOLS_VERSION}, "families": {}}
    used = used_characters()
    problems: list[str] = []
    stale: list[str] = []
    for fam in FAMILIES:
        core, ext = split(fam)
        src = SOURCE_DIR / fam.source
        entry = {
            "name": fam.name,
            "source": {"file": fam.source, "bytes": src.stat().st_size, "sha256": hashlib.sha256(src.read_bytes()).hexdigest()},
            "axes": {k: list(v) for k, v in fam.axes.items()},
            "features": list(fam.features),
            "files": {},
        }
        produced = {}
        for kind, cps in (("core", core), ("ext", ext)):
            data = build(fam, cps, force_rename)
            produced[kind] = (cps, data)
            name = f"{fam.slug}-{kind}.woff2"
            font = TTFont(io.BytesIO(data))
            entry["files"][kind] = {
                "file": name,
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "glyphs": len(font.getGlyphOrder()),
                "characters": len(cps),
                "unicodeRange": to_ranges(cps),
            }
            path = OUT_DIR / name
            if check_only:
                if not path.exists() or path.read_bytes() != data:
                    stale.append(name)
            else:
                path.write_bytes(data)
        manifest["families"][fam.slug] = entry
        problems += check_structure(fam, produced)
        parity, worst = check_parity(fam, produced)
        problems += parity
        reserved = declares_reserved_name(fam, TTFont(src))
        print(f"{fam.name}: Reserved Font Name declared: {'yes, renamed' if reserved else 'no, names left as they are'}")
        for kind in ("core", "ext"):
            f = entry["files"][kind]
            print(f"  {f['file']:<26} {f['bytes']:>6} B  {f['characters']:>3} chars  {f['glyphs']:>3} glyphs")
        print(f"  was {entry['source']['bytes']} B in one file")
        print("  largest deviation from the source (font units): "
              + ", ".join(f"{'wght ' + str(w) if w else 'static'} {d:.2f}" for w, d in sorted(worst.items(), key=lambda kv: kv[0] or 0)))
        outside = sorted(c for c in used if c in set(TTFont(src).getBestCmap()) and c not in core | ext)
        if outside:
            print("  used by the site, in the source font, but never served by it (still drawn by the system font): "
                  + " ".join(f"U+{c:04X}" for c in outside))
        edge = boundary_kerning(fam, core, ext, used & ext)
        if edge:
            print(f"  now in different files, so no kerning or contextual alternates between them: {' '.join(edge[:40])}"
                  + (f" ... {len(edge)} pairs" if len(edge) > 40 else ""))
    text = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    mpath = OUT_DIR / "manifest.json"
    if check_only:
        if not mpath.exists() or mpath.read_text() != text:
            stale.append("manifest.json")
    else:
        mpath.write_text(text)
    if problems:
        print("\nPROBLEMS:\n  " + "\n  ".join(problems))
        return 1
    if stale:
        print("\nSTALE: " + ", ".join(stale) + "\nRun: python3 scripts/fonts/subset-fonts.py")
        return 1
    print("\nOK: structure and glyph/shaping parity with the source font verified.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="rebuild in memory and fail if src/assets/fonts is stale")
    ap.add_argument("--audit", metavar="DIST", help="page frequency of each non-ASCII character in a built site")
    ap.add_argument("--force-rename", action="store_true", help="apply the Reserved Font Name rename even if not required (for testing)")
    args = ap.parse_args()
    if args.audit:
        audit(Path(args.audit), FAMILIES)
        return 0
    return run(args.check, args.force_rename)


if __name__ == "__main__":
    sys.exit(main())
