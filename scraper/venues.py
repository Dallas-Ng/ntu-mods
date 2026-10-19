"""
venues.py
=========

Resolve every venue string in the newest semesters' schedules to a room on the
NTU map, and write the map data the site draws.

    python3 venues.py                  # newest two semesters, reuse the MazeMap snapshot
    python3 venues.py -s "2026;1"
    python3 venues.py --refresh        # re-download the MazeMap snapshot first

Sources (all public, no key):
  - NTU FBS location list    -> short name (LT1, TR+3) to room code (NS3-02-09)
  - MazeMap (maps.ntu.edu.sg) -> buildings, every level's rooms, stairs, lifts,
                                 landmarks (see mazemap_dump.py for the raw snapshot)

Writes src/data/venues/:
  venues.json          campus outlines, levels, venues, landmarks (loaded by the map page)
  buildings/<id>.json  one building's levels: footprint, rooms, corridors, stairs, lifts
Prints which venue strings could not be resolved, most used first.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

import mazemap_dump

SCRAPER_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRAPER_DIR.parent
INDEXES_DIR = REPO_ROOT / "src" / "data" / "api" / "indexes"
OUT_DIR = REPO_ROOT / "src" / "data" / "venues"
OVERRIDES = SCRAPER_DIR / "venue_overrides.json"
SNAPSHOT = mazemap_dump.OUT

FBS_URL = "https://wis.ntu.edu.sg/pls/webexe88/FBSDOCU.FBSLOCATN"
MAZE = "https://api.mazemap.com"
CAMPUS_ID = 2123  # NTU - Main Campus

#: Outlines are projected to metres from the north-west corner of this box.
LON0, LON1 = 103.6750, 103.6980
LAT0, LAT1 = 1.3395, 1.3580
#: Douglas-Peucker tolerance in metres: drops detail nobody sees at campus scale.
SIMPLIFY_M = 1.2

#: Not physical places: never try to locate these.
NOT_A_PLACE = {"", "ONLINE", "TBC", "TBA", "NIL", "-"}

SEM_ORDER = {"1": 1, "2": 2, "S": 3, "T": 4}

M_PER_DEG_LAT = 111_320
M_PER_DEG_LON = 111_320 * math.cos(math.radians((LAT0 + LAT1) / 2))
WIDTH_M = round((LON1 - LON0) * M_PER_DEG_LON)
HEIGHT_M = round((LAT1 - LAT0) * M_PER_DEG_LAT)

#: Landmark categories the map can label and toggle. MazeMap type name -> category.
LANDMARK_TYPES = {
    "Food and Beverages Outlet": "food",
    "Bus Stop": "transport",
    "MRT Station": "transport",
    "Library": "study",
    "Student Centre and Lounge": "study",
    "Sports and Recreation": "sports",
    "Examination Hall": "exam",
    "ATM": "services",
    "Retail Outlet": "services",
    "Carpark": "parking",
    "Female Toilet": "toilet",
    "Male Toilet": "toilet",
    "Handicap Toilet": "toilet",
    "AED": "aed",
}
#: Rooms MazeMap files under a generic type (a gym is a "Workshop") are still
#: places a student looks for, so also categorise by name.
TITLE_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(p, re.I), c)
    for p, c in [
        (r"\b(gym|fitness|swimming|pool|stadium|badminton|squash|tennis|basketball|futsal|volleyball|netball|hockey|rugby|archery|climbing|yoga|dance studio|playing field|sports field|running track)\b", "sports"),
        (r"\b(canteen|food court|food hall|food paradise|kopitiam|bakery|restaurant|bistro|bubble tea|koufu|starbucks|mcdonald|cafe|coffee)", "food"),
        (r"\b(library|study room|study area|reading room|learning hub)\b", "study"),
        (r"\b(clinic|pharmacy|post office|bank|photocopy|bookshop|co-?op|salon|supermarket|laundry|surau|prayer|chapel|multi-?faith|registry|one stop|student service)", "services"),
        (r"\bexam(ination)? hall\b", "exam"),
        (r"\b(toilet|restroom|washroom)s?\b", "toilet"),
    ]
]
#: Titles that match a rule but are not a place to go to.
NOT_A_STOP = re.compile(r"store|storage|preparation|prep room|server|plant room|riser|substation|locker room", re.I)


def title_category(title: str) -> str | None:
    if NOT_A_STOP.search(title):
        return None
    return next((c for rx, c in TITLE_RULES if rx.search(title)), None)


def hall_label(name: str) -> str | None:
    """The residence a building belongs to: 'Block 17A (Crescent Hall)' -> 'Crescent Hall'.
    None for anything that is not a hall of residence (food courts, offices...)."""
    name = name.strip()
    if re.search(r"food court|res edu|carpark", name, re.I):
        return None
    if m := re.search(r"\((Hall \d+|[A-Z][a-z]+ Hall)\)", name):
        return m.group(1)
    if m := re.match(r"(Hall \d+)( - |$)", name):
        return m.group(1)
    if m := re.match(r"Hall of Residence (\d+)$", name):
        return f"Hall {m.group(1)}"
    if m := re.match(r"(Graduate Hall \d+|Saraca Hall|Tamarind Hall|Maple Residences)$", name):
        return m.group(1)
    if m := re.match(r"Tanjong Hall", name):
        return "Tanjong Hall"
    if name.startswith("30 Nanyang Link"):
        return "Nanyang Link"
    return None

session = requests.Session()


def get_json(url: str, **params) -> dict:
    r = session.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


# --- geometry -----------------------------------------------------------


def to_m(lon: float, lat: float) -> tuple[float, float]:
    """Metres east / south of the box's north-west corner."""
    return (lon - LON0) * M_PER_DEG_LON, (LAT1 - lat) * M_PER_DEG_LAT


def simplify(pts: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy)
    best, idx = 0.0, 0
    for i, (x, y) in enumerate(pts[1:-1], 1):
        d = math.hypot(x - x1, y - y1) if not norm else abs(dy * (x - x1) - dx * (y - y1)) / norm
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def flat(pts: list[tuple[float, float]]) -> list[float]:
    return [round(c, 1) for p in pts for c in p]


def polygons(geom: dict | None) -> list[list]:
    """Rings of a Polygon/MultiPolygon: [outer, *holes] per polygon."""
    if not geom:
        return []
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return list(geom["coordinates"])
    return []


def outline(geom: dict | None, tol: float = SIMPLIFY_M) -> list[list[float]]:
    """Rings (outer + holes of every polygon) as flat [x0,y0,x1,y1,...] in metres."""
    rings = []
    for poly in polygons(geom):
        for ring in poly:
            pts = simplify([to_m(lon, lat) for lon, lat in ring], tol)
            if len(pts) >= 4:  # closed ring: first == last
                rings.append(flat(pts[:-1]))
    return rings


def centroid(geom: dict) -> tuple[float, float]:
    pts = [p for rings in polygons(geom) for p in rings[0]]
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


# --- MazeMap snapshot -----------------------------------------------------


def clean(s: str | None) -> str:
    return re.sub(r"[​\s]+", " ", s or "").strip()


def load_snapshot(refresh: bool) -> tuple[list[dict], list[dict]]:
    if refresh or not (SNAPSHOT / "pois_2123.json").exists():
        mazemap_dump.main()
    pois = [p for p in json.loads((SNAPSHOT / "pois_2123.json").read_text()) if not p.get("deleted")]
    for p in pois:
        p["poiId"] = int(p["poiId"])
        p["z"] = float(p["z"] or 0)
        p["buildingId"] = int(p["buildingId"]) if p.get("buildingId") else None
    buildings = json.loads((SNAPSHOT / "buildings_2123.json").read_text())["buildings"]
    return pois, buildings


def type_of(p: dict) -> str:
    return (p.get("types") or [{}])[0].get("name", "")


class Index:
    """Lookups over the snapshot: a room by id, code or any of its names."""

    def __init__(self, pois: list[dict]):
        self.by_id = {p["poiId"]: p for p in pois}
        self.by_code: dict[str, dict] = {}
        self.by_name: dict[str, list[dict]] = defaultdict(list)
        for p in pois:
            if p.get("identifier"):
                self.by_code.setdefault(p["identifier"].upper(), p)
            for n in {clean(i.get("name")) for i in p.get("infos") or []} | {clean(p.get("title"))}:
                if n:
                    self.by_name[n.upper()].append(p)

    def named(self, name: str) -> dict | None:
        """A room whose own name is `name` (LT19A -> 'LT19A (NS)'): word match, rooms first."""
        pat = re.compile(r"(?<![A-Z0-9])" + re.escape(name.upper()) + r"(?![A-Z0-9])")
        best = None
        for key, ps in self.by_name.items():
            if pat.search(key):
                for p in ps:
                    if p["kind"] in ("room", "circulation_room", "generic"):
                        if key.startswith(name.upper()):
                            return p
                        best = best or p
        return best


# --- FBS + search -----------------------------------------------------------


def load_fbs() -> dict[str, str]:
    """FBS facility name -> room code. Keys are upper-case first tokens plus any
    '(LT2)'-style alias, e.g. 'TCT-LT Tan Chin Tuan Lecture Theatre (LT2)'."""
    html = session.get(FBS_URL, timeout=30).text
    out: dict[str, str] = {}
    for row in re.findall(r"<tr.*?</tr>", html, flags=re.S | re.I):
        cells = [re.sub(r"<[^>]+>|&nbsp;", " ", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S | re.I)]
        if len(cells) < 4:
            continue
        facility, location = cells[1], cells[3]
        m = re.match(r"[A-Za-z0-9.+\-]+", location)
        if not m or not re.search(r"\d", m.group()):
            continue
        code = m.group().upper()
        names = {facility.split()[0].upper()}
        names.update(a.upper() for a in re.findall(r"\(([A-Za-z0-9+\-]+)\)", facility))
        for n in names:
            out.setdefault(n, code)
    return out


def search(q: str) -> list[dict]:
    try:
        return get_json(f"{MAZE}/search/equery/", q=q, rows=5, start=0, withpois="true", campusid=CAMPUS_ID)["result"]
    except requests.RequestException:
        return []


def latest_venues(acadsem: str | None, last: int = 2) -> Counter:
    """Venue string -> class slots, over one semester or the newest `last` ones
    (a student can open last semester's timetable too)."""

    def key(p: Path):
        y, s = p.stem.split("_")
        return int(y), SEM_ORDER.get(s, 0)

    files = sorted(INDEXES_DIR.glob("*.json"), key=key)[-last:]
    if acadsem:
        files = [INDEXES_DIR / (acadsem.replace(";", "_") + ".json")]
    counts: Counter = Counter()

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k == "venue" and isinstance(v, str):
                    counts[v.strip()] += 1
                else:
                    walk(v)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    for path in files:
        walk(json.loads(path.read_text()))
    print(f"[venues] {', '.join(p.name for p in files)}: {len(counts)} distinct venue strings")
    return counts


# --- resolve --------------------------------------------------------------


def resolve(venue: str, fbs: dict[str, str], overrides: dict[str, str], idx: Index) -> tuple[dict | None, str]:
    """-> (poi | None, how). `how` is override | fbs | exact | fuzzy | skip | none."""
    v = venue.lstrip("/").strip()
    if v.upper() in NOT_A_PLACE:
        return None, "skip"

    def lookup(code: str, name: str) -> dict | None:
        p = idx.by_code.get(code.upper())
        if p:
            return p
        if code.upper() in idx.by_name:
            return idx.by_name[code.upper()][0]
        p = idx.named(name)  # rooms MazeMap holds without a code, e.g. 'LT19A (NS)'
        if p:
            return p
        hits = search(code)
        return next((idx.by_id[h["poiId"]] for h in hits if h["poiId"] in idx.by_id and (h.get("identifier") or "").upper() == code.upper()), None)

    if venue in overrides:
        # value = a code, a name, or "" for "not a locatable place"
        q = overrides[venue]
        if not q:
            return None, "skip"
        p = lookup(q, q) or next((idx.by_id[h["poiId"]] for h in search(q) if h["poiId"] in idx.by_id), None)
        return (p, "override") if p else (None, "skip")

    code = fbs.get(v.upper())
    if code:
        p = lookup(code, v)
        if p:
            return p, "fbs"
    p = idx.by_code.get(v.upper()) or (idx.by_name.get(v.upper()) or [None])[0]
    if p:
        return p, "exact"
    for h in search(v)[:1]:
        if h["poiId"] in idx.by_id:
            return idx.by_id[h["poiId"]], "fuzzy"
    return None, "none"


# --- output ---------------------------------------------------------------


def short_name(name: str) -> str:
    s = re.sub(r"\s*\(.*?\)", "", name)
    s = re.sub(r".*\[(.+?)\]\s*", r"\1 ", s).strip()
    return s if len(s) <= 24 else s[:23] + "…"


def level_names(buildings: list[dict]) -> list[dict]:
    names: dict[float, Counter] = defaultdict(Counter)
    for b in buildings:
        for f in b["floors"]:
            names[f["z"]][f["name"]] += 1
    return [
        {"z": int(z), "name": names[z].most_common(1)[0][0]}
        for z in sorted(names)
        if z == int(z) and z != 0
    ]


def building_chunk(b: dict, by_building: dict[int, list[dict]], venue_poi: dict[int, str]) -> dict:
    floors = {}
    for f in b["floors"]:
        if f["z"] != int(f["z"]):
            continue
        floors[int(f["z"])] = {
            "name": f["name"],
            "outline": outline(f.get("outline")),
            "rooms": [],
            "halls": [],
            "stairs": [],
            "lifts": [],
        }
    for p in by_building.get(b["id"], []):
        fl = floors.get(int(p["z"]))
        rings = outline(p.get("geometry"), 0.8)
        if not fl or not rings:
            continue
        kind = p["kind"]
        title = clean(p.get("title"))
        if kind == "stairs":
            fl["stairs"].append(rings)
        elif kind == "elevator":
            fl["lifts"].append(rings)
        elif kind == "circulation_room" and not title:
            fl["halls"].append(rings)
        elif kind in ("room", "circulation_room", "generic") and (title or kind == "room"):
            room = {"i": p["poiId"], "r": rings}
            if title:
                room["n"] = title
            if p.get("identifier"):
                room["c"] = p["identifier"]
            if type_of(p):
                room["t"] = type_of(p)
            if p["poiId"] in venue_poi:
                room["v"] = venue_poi[p["poiId"]]
            fl["rooms"].append(room)
    return {"id": b["id"], "floors": {str(z): f for z, f in sorted(floors.items())}}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-s", "--semester", help='e.g. "2026;1" (default: newest two)')
    ap.add_argument("--refresh", action="store_true", help="re-download the MazeMap snapshot")
    args = ap.parse_args()

    counts = latest_venues(args.semester)
    overrides = json.loads(OVERRIDES.read_text()) if OVERRIDES.exists() else {}
    fbs = load_fbs()
    pois, buildings = load_snapshot(args.refresh)
    idx = Index(pois)
    print(f"[venues] FBS names {len(fbs)}, MazeMap buildings {len(buildings)}, places {len(pois)}")

    with ThreadPoolExecutor(8) as ex:
        resolved = list(ex.map(lambda v: resolve(v, fbs, overrides, idx), counts))

    by_building: dict[int, list[dict]] = defaultdict(list)
    for p in pois:
        if p["buildingId"]:
            by_building[p["buildingId"]].append(p)
    geom_of = {b["id"]: b.get("fullOutline") or b.get("visibleOutline") for b in buildings}
    floor_name = {(b["id"], f["z"]): f["name"] for b in buildings for f in b["floors"]}

    venues: dict[str, dict] = {}
    by_how: Counter = Counter()
    slots_by_how: Counter = Counter()
    unresolved: list[tuple[int, str]] = []
    for venue, (p, how) in zip(counts, resolved):
        by_how[how] += 1
        slots_by_how[how] += counts[venue]
        if not p:
            if how != "skip":
                unresolved.append((counts[venue], venue))
            continue
        lon, lat = p["point"]["coordinates"]
        x, y = to_m(lon, lat)
        venues[venue] = {
            "poi": p["poiId"],
            "code": p.get("identifier"),
            "name": clean(p.get("title")),
            "b": p["buildingId"],
            "z": int(p["z"]),
            "floor": floor_name.get((p["buildingId"], p["z"])) or p.get("floorName"),
            "lon": round(lon, 6),
            "lat": round(lat, 6),
            "x": round(x, 1),
            "y": round(y, 1),
            "how": how,
            "slots": counts[venue],
        }

    slots_by_b: Counter = Counter()
    for v in venues.values():
        slots_by_b[v["b"]] += v["slots"]

    # Landmarks: typed places, plus halls of residence grouped by hall.
    short_of = {b["id"]: short_name(b["name"]) for b in buildings if b.get("name")}
    landmarks: list[dict] = []
    seen: set[tuple] = set()
    for p in pois:
        title = clean(p.get("title"))
        cat = LANDMARK_TYPES.get(type_of(p)) or (title_category(title) if p["kind"] in ("room", "generic", "circulation_room") else None)
        if not cat or p["kind"] == "parking_space" or not (title or cat in ("toilet", "aed")):
            continue
        key = (title.lower(), p["buildingId"], p["z"])
        if key in seen:
            continue
        seen.add(key)
        lon, lat = p["point"]["coordinates"]
        x, y = to_m(lon, lat)
        if not (0 <= x <= WIDTH_M and 0 <= y <= HEIGHT_M):
            continue
        name = title or type_of(p)
        if cat == "toilet" and p["buildingId"] in short_of:
            name = f"{name} ({short_of[p['buildingId']]})"
        landmarks.append({"id": p["poiId"], "c": cat, "n": name, "b": p["buildingId"], "z": int(p["z"]), "x": round(x, 1), "y": round(y, 1)})
    halls: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for b in buildings:
        label = hall_label(b.get("name") or "")
        geom = geom_of.get(b["id"])
        if label and geom:
            halls[label].append(to_m(*centroid(geom)))
    for label, pts in halls.items():
        landmarks.append({"id": f"hall:{label}", "c": "hall", "n": label, "b": None, "z": 0, "x": round(sum(p[0] for p in pts) / len(pts), 1), "y": round(sum(p[1] for p in pts) / len(pts), 1)})

    hall_buildings = {b["id"] for b in buildings if hall_label(b.get("name") or "")}
    venue_poi = {v["poi"]: k for k, v in venues.items()}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    chunks = OUT_DIR / "buildings"
    chunks.mkdir(exist_ok=True)
    for old in chunks.glob("*.json"):
        old.unlink()
    # MazeMap lists floors for ~240 buildings but only maps the inside of ~40
    # (halls and most others have floor names and nothing else). Ship only those
    # with real rooms or outlines.
    indoor: set[int] = set()
    for b in buildings:
        if not b["floors"]:
            continue
        chunk = building_chunk(b, by_building, venue_poi)
        if any(f["rooms"] or f["outline"] for f in chunk["floors"].values()):
            (chunks / f"{b['id']}.json").write_text(json.dumps(chunk, separators=(",", ":")))
            indoor.add(b["id"])

    out = {
        "size": {"width": WIDTH_M, "height": HEIGHT_M},
        "origin": {"lon0": LON0, "lat1": LAT1, "mPerLon": round(M_PER_DEG_LON, 2), "mPerLat": M_PER_DEG_LAT},
        "levels": level_names(buildings),
        "buildings": [
            {
                "id": b["id"],
                "name": b["name"],
                "short": short_name(b["name"]),
                "rings": rings,
                "levels": sorted({int(f["z"]) for f in b["floors"] if f["z"] == int(f["z"])}) if b["id"] in indoor else [],
                "slots": slots_by_b[b["id"]],
                "indoor": b["id"] in indoor,
                "hall": b["id"] in hall_buildings,
            }
            for b in buildings
            if geom_of.get(b["id"]) and b.get("name")
            # MazeMap has a few outlines in the wrong coordinate system; drop anything off campus.
            and (rings := outline(geom_of[b["id"]]))
            and all(-300 <= c <= max(WIDTH_M, HEIGHT_M) + 300 for r in rings for c in r)
        ],
        "venues": venues,
        "landmarks": landmarks,
    }
    (OUT_DIR / "venues.json").write_text(json.dumps(out, separators=(",", ":")))
    chunk_bytes = sum(f.stat().st_size for f in chunks.glob("*.json"))

    total = sum(counts.values())
    print("[venues] how:", dict(by_how))
    for how in ("fbs", "override", "exact", "fuzzy", "none", "skip"):
        print(f"  {how:9} {by_how[how]:4} venues  {100 * slots_by_how[how] / total:5.1f}% of class slots")
    print(f"[venues] {len(venues)} placed; {len(landmarks)} landmarks ({dict(Counter(l['c'] for l in landmarks))})")
    print(f"[venues] venues.json {(OUT_DIR / 'venues.json').stat().st_size / 1e3:.0f} kB; {len(list(chunks.glob('*.json')))} building files, {chunk_bytes / 1e6:.2f} MB")
    if unresolved:
        print("[venues] unresolved (add to scraper/venue_overrides.json):")
        for n, v in sorted(unresolved, reverse=True)[:25]:
            print(f"  {n:5} {v}")
    fuzzy = sorted(((v["slots"], k, v["name"]) for k, v in venues.items() if v["how"] == "fuzzy"), reverse=True)
    if fuzzy:
        print(f"[venues] {len(fuzzy)} fuzzy matches (unverified), biggest first:")
        for n, k, name in fuzzy[:20]:
            print(f"  {n:5} {k!r} -> {name}")


if __name__ == "__main__":
    main()
