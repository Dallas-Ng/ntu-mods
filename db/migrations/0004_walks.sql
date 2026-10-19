-- Walking routes from MazeMap, kept so each pair is routed once, ever.
-- key is "lon,lat,z>lon,lat,z" in sorted order (see src/lib/walk-route.ts);
-- v is ROUTE_CACHE_VERSION. To purge after the map data changes, bump the
-- version and DELETE FROM walks, then reseed (scripts/db/seed-walks.mts).
-- Not touched by reseed-d1.mjs or load-semester.mjs.
CREATE TABLE walks (
  key   TEXT PRIMARY KEY,
  v     TEXT NOT NULL,
  route TEXT NOT NULL
);
