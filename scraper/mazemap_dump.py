"""
mazemap_dump.py
===============

Raw, un-curated snapshot of everything MazeMap exposes for NTU (maps.ntu.edu.sg),
so we can see what is possible before deciding what the site uses. Local only:
writes scraper/data/mazemap/*.json, which is gitignored.

    python3 mazemap_dump.py
"""

from __future__ import annotations

import json
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parent / "data" / "mazemap"
API = "https://api.mazemap.com"
TAG = "ntu-sg"
s = requests.Session()


def get(path: str, **params):
    r = s.get(API + path, params=params, timeout=60)
    r.raise_for_status()
    return r.json()


def save(name: str, obj) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(obj, separators=(",", ":")))
    print(f"  wrote {name}  {(OUT / name).stat().st_size / 1e6:.2f} MB")


def all_pois(campus: int) -> list[dict]:
    """/api/pois/ returns <=2000 rows and a `fromid` cursor."""
    out: list[dict] = []
    fromid = None
    while True:
        params = dict(campusid=campus, srid=4326)
        if fromid:
            params["fromid"] = fromid
        r = get("/api/pois/", **params)
        batch = r["pois"]
        out += batch
        print(f"    campus {campus}: {len(out)} pois")
        if len(batch) < r.get("limit", 2000):
            return out
        fromid = batch[-1]["poiId"]


def main() -> None:
    save("webappconfig.json", get(f"/api/webappconfig/{TAG}/"))
    cc = get(f"/api/campuscollection/{TAG}/", withcampuses="true")
    save("campuses.json", cc)
    for c in cc["campuses"]:
        cid = c["campusId"]
        print(c["name"], cid)
        save(f"buildings_{cid}.json", get("/api/buildings/", campusid=cid, srid=4326))
        pois = all_pois(cid)
        save(f"pois_{cid}.json", pois)

        tc = Counter(t["name"] for p in pois for t in (p.get("types") or [{"name": "(none)"}]))
        kc = Counter(p.get("kind") for p in pois)
        gc = Counter((p.get("geometry") or {}).get("type") for p in pois)
        print("   kinds", dict(kc), "geometry", dict(gc))
        print("   top types", tc.most_common(25))

    # One POI in full, to see what detail adds beyond the list.
    main_pois = json.loads((OUT / "pois_2123.json").read_text())
    sample = next(p for p in main_pois if p.get("identifier") == "NS4-05-81")
    detail = get(f"/api/pois/{sample['poiId']}/", srid=4326)
    print("list keys  ", sorted(sample))
    print("detail keys", sorted(detail))
    save("sample_poi_detail.json", detail)


if __name__ == "__main__":
    main()
