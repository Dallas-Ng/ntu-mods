"""
terrain.py
==========

Flat "terrain" for the Standard map view: greens, water, pitches and roads from
OpenStreetMap (ODbL, credit shown on the map), projected and simplified into
src/data/venues/terrain.json.

    python3 terrain.py                 # fetch from Overpass (cached), then write
    python3 terrain.py --refresh       # ignore the cache
    python3 terrain.py --osm raw.json  # use an Overpass JSON you already have

The map draws these under the building outlines. Run it rarely: campus roads and
lawns change slowly.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import math

import requests

import venues as v

SCRAPER_DIR = Path(__file__).resolve().parent
CACHE = SCRAPER_DIR / "data" / "osm" / "campus.json"
OUT = v.OUT_DIR / "terrain.json"

BBOX = f"{v.LAT0},{v.LON0},{v.LAT1},{v.LON1}"
QUERY = f"""[out:json][timeout:90];
(
 way["natural"~"wood|scrub|grassland|water|wetland"]({BBOX});
 way["landuse"~"grass|forest|meadow|recreation_ground|village_green|reservoir|basin|cemetery"]({BBOX});
 way["leisure"~"park|pitch|garden|golf_course|swimming_pool|stadium|track|playground|nature_reserve"]({BBOX});
 way["waterway"~"riverbank|stream|river|canal"]({BBOX});
 way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street|pedestrian|footway|path|cycleway|steps"]({BBOX});
 relation["natural"~"wood|water"]({BBOX});
 relation["leisure"~"park|pitch"]({BBOX});
 relation["landuse"~"grass|forest"]({BBOX});
);
out geom;"""

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

GREEN = {
    "natural": {"wood", "scrub", "grassland"},
    "landuse": {"grass", "forest", "meadow", "recreation_ground", "village_green", "cemetery"},
    "leisure": {"park", "garden", "golf_course", "nature_reserve"},
}
PITCH = {"leisure": {"pitch", "track", "stadium", "playground"}}
WATER = {
    "natural": {"water", "wetland"},
    "landuse": {"reservoir", "basin"},
    "leisure": {"swimming_pool"},
    "waterway": {"riverbank"},
}
STREAM = {"waterway": {"stream", "river", "canal"}}
ROAD_CLASS = {
    "motorway": "major", "motorway_link": "major", "trunk": "major", "trunk_link": "major",
    "primary": "major", "primary_link": "major", "secondary": "major", "secondary_link": "major",
    "tertiary": "major", "tertiary_link": "major",
    "unclassified": "minor", "residential": "minor", "service": "minor", "living_street": "minor",
    "pedestrian": "path", "footway": "path", "path": "path", "cycleway": "path", "steps": "path",
}


#: Keep terrain this close to NTU's own boundary (metres): enough for the roads
#: around the edge, not the estates and expressway beyond it.
MARGIN_M = 60


def campus_outline() -> list[tuple[float, float]]:
    """NTU Main Campus boundary from the MazeMap snapshot, in map metres."""
    cc = json.loads((v.SNAPSHOT / "campuses.json").read_text())
    geom = next(c for c in cc["campuses"] if c["campusId"] == v.CAMPUS_ID)["geometry"]
    return [v.to_m(lon, lat) for lon, lat in geom["coordinates"][0]]


def make_inside(poly: list[tuple[float, float]]):
    def seg_dist(px, py, a, b):
        (ax, ay), (bx, by) = a, b
        dx, dy = bx - ax, by - ay
        t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

    def inside(p: tuple[float, float]) -> bool:
        x, y = p
        hit = False
        for a, b in zip(poly, poly[1:] + poly[:1]):
            if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
                hit = not hit
        if hit:
            return True
        return min(seg_dist(x, y, a, b) for a, b in zip(poly, poly[1:] + poly[:1])) <= MARGIN_M

    return inside


def runs(pts: list[tuple[float, float]], inside) -> list[list[tuple[float, float]]]:
    """Pieces of a line that lie within the campus margin."""
    out, cur = [], []
    for p in pts:
        if inside(p):
            cur.append(p)
        else:
            if len(cur) >= 2:
                out.append(cur)
            cur = []
    if len(cur) >= 2:
        out.append(cur)
    return out


def fetch(refresh: bool) -> dict:
    if CACHE.exists() and not refresh:
        return json.loads(CACHE.read_text())
    for attempt in range(6):
        for url in MIRRORS:
            try:
                r = requests.post(
                    url,
                    data={"data": QUERY},
                    headers={"User-Agent": "ntumods-campus-map/1.0"},
                    timeout=150,
                )
                if r.ok and r.text.startswith("{"):
                    CACHE.parent.mkdir(parents=True, exist_ok=True)
                    CACHE.write_text(r.text)
                    return r.json()
                print(f"[terrain] {url}: {r.status_code}")
            except requests.RequestException as e:
                print(f"[terrain] {url}: {str(e)[:60]}")
        time.sleep(20)
    sys.exit("[terrain] Overpass is unreachable, try again later")


def matches(tags: dict, table: dict[str, set[str]]) -> bool:
    return any(tags.get(k) in vals for k, vals in table.items())


def points(geom: list[dict]) -> list[tuple[float, float]]:
    return [v.to_m(p["lon"], p["lat"]) for p in geom]


def build(osm: dict, inside) -> dict:
    out: dict = {"green": [], "pitch": [], "water": [], "streams": [], "roads": {"major": [], "minor": [], "path": []}}
    tol = {"major": 1.5, "minor": 2.0, "path": 2.5}
    for e in osm["elements"]:
        tags = e.get("tags", {})
        # Area outlines: a way, or the outer members of a multipolygon.
        rings = []
        if e["type"] == "way" and "geometry" in e:
            rings = [e["geometry"]]
        elif e["type"] == "relation":
            rings = [m["geometry"] for m in e.get("members", []) if m.get("role") == "outer" and "geometry" in m]

        for layer, table in (("water", WATER), ("pitch", PITCH), ("green", GREEN)):
            if matches(tags, table):
                for g in rings:
                    # Only closed outlines: a multipolygon's pieces are often open
                    # fragments of one ring, and filling them draws wedges.
                    if len(g) >= 4 and g[0] == g[-1]:
                        raw = points(g)
                        if not any(inside(p) for p in raw[::3] + raw[-1:]):
                            continue
                        pts = v.simplify(raw, 2.0)
                        if len(pts) >= 4:
                            out[layer].append(v.flat(pts[:-1] if pts[0] == pts[-1] else pts))
                break
        else:
            if e["type"] == "way" and "geometry" in e:
                if matches(tags, STREAM):
                    for piece in runs(points(e["geometry"]), inside):
                        out["streams"].append(v.flat(v.simplify(piece, 2.0)))
                elif tags.get("highway") in ROAD_CLASS:
                    cls = ROAD_CLASS[tags["highway"]]
                    for piece in runs(points(e["geometry"]), inside):
                        pts = v.simplify(piece, tol[cls])
                        if len(pts) >= 2:
                            out["roads"][cls].append(v.flat(pts))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true")
    ap.add_argument("--osm", help="an Overpass JSON file to use instead of fetching")
    args = ap.parse_args()

    osm = json.loads(Path(args.osm).read_text()) if args.osm else fetch(args.refresh)
    terrain = build(osm, make_inside(campus_outline()))
    v.OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(terrain, separators=(",", ":")))
    n = {k: (len(x) if isinstance(x, list) else {kk: len(vv) for kk, vv in x.items()}) for k, x in terrain.items()}
    print(f"[terrain] {n}  ->  {OUT.name} {OUT.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
