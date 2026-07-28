-- NTU Mods D1 schema — initial migration.
--
-- Design rule (see D1_MIGRATION_PLAN.md §4):
--   Derive at LOAD when every input is inside one semester
--     (faculty, categories, start_min, end_min).
--   Derive at READ when inputs span semesters (is_current, latest_sem) —
--     loading one semester would silently falsify a stored cross-semester
--     value on every other row.
--
-- There is deliberately no `modules` table, no `is_current` column and no
-- `latest_sem` column.

CREATE TABLE semesters (
  sem      TEXT PRIMARY KEY,  -- "2025_2"
  code     TEXT NOT NULL,     -- "2025;2" (NTU portal form)
  year     TEXT NOT NULL,
  semester TEXT NOT NULL,     -- 1 | 2 | S | T
  name     TEXT NOT NULL,     -- "Acad Yr 2025 Semester 2"
  -- int(year)*10 + {1:1, 2:2, S:3, T:4}. Computed from the code, never from
  -- insertion order or the portal's list position — the portal's ordering is
  -- not self-consistent (AY2025 lists 2,1,S; AY2024 lists 1,2,S).
  sort_key INTEGER NOT NULL
);

-- Per-semester module record. Title and description live here, not in a global
-- modules table, because they genuinely vary across semesters (700 title and
-- 1,522 description changes across the 45 semesters). faculty and categories
-- are computed at load from this offering's own programmes.
CREATE TABLE offerings (
  code TEXT NOT NULL,
  sem  TEXT NOT NULL REFERENCES semesters(sem),
  title TEXT NOT NULL,
  au    TEXT NOT NULL,
  faculty    TEXT,  -- precomputed; replaces src/lib/get-module-faculty.ts
  categories TEXT,  -- precomputed JSON array; replaces src/lib/get-module-category.ts
  description TEXT,
  grade_type  TEXT,
  not_available_to_programme          TEXT,
  not_available_to_all_programme_with TEXT,
  not_available_as_bdeue_to_programme TEXT,
  not_available_as_core_to_programme  TEXT,
  not_available_as_pe_to_programme    TEXT,
  not_offered_as_bde TEXT,
  not_offered_as_ue  TEXT,
  mutually_exclusive_with TEXT,  -- JSON array
  extras TEXT,                   -- JSON object; scraper catch-all, so new NTU
                                 -- fields never require a migration
  PRIMARY KEY (code, sem)
);

CREATE TABLE programmes (
  id      INTEGER PRIMARY KEY,
  key     TEXT NOT NULL UNIQUE,  -- "CSC;;1;F"
  faculty TEXT,
  -- Segment 2 is the study year (1-5) for a programme core listing, or "X" for
  -- the GLOAD / MLOAD / GERP / USP / CNY / EP buckets.
  is_core INTEGER
);

CREATE TABLE offering_programmes (
  code TEXT NOT NULL,
  sem  TEXT NOT NULL,
  programme_id INTEGER NOT NULL REFERENCES programmes(id),
  -- Position in the source searchKeys array. Preserved because
  -- getModuleFaculty is last-match-wins over that array, so order is
  -- semantically load-bearing.
  seq INTEGER NOT NULL,
  PRIMARY KEY (code, sem, programme_id)
);

CREATE TABLE class_indexes (
  code TEXT NOT NULL,
  sem  TEXT NOT NULL,
  index_key TEXT NOT NULL,
  PRIMARY KEY (code, sem, index_key)
);

CREATE TABLE class_slots (
  code TEXT NOT NULL,
  sem  TEXT NOT NULL,
  index_key TEXT NOT NULL,
  slot_no INTEGER NOT NULL,  -- position within the index's slot array
  type TEXT,
  grp  TEXT,
  day  INTEGER,              -- nullable: 1,201 slots have no day
  time TEXT,                 -- "0830-0930"; kept verbatim for display
  -- Precomputed minutes-since-midnight. Null when time is "" (1,213 slots).
  -- Kills the client-side parseInt(time.split("-")) in filter-modules.ts.
  start_min INTEGER,
  end_min   INTEGER,
  venue TEXT,
  remarks TEXT,
  duration INTEGER,
  PRIMARY KEY (code, sem, index_key, slot_no)
);

CREATE TABLE exams (
  code TEXT NOT NULL,
  sem  TEXT NOT NULL,
  date TEXT,
  day  INTEGER,
  start_time TEXT,
  end_time   TEXT,
  name TEXT,
  duration INTEGER,
  PRIMARY KEY (code, sem)
);

-- raw_text is ALWAYS populated. requires_code is set only when the item parses
-- as a module code — 30% of prerequisite items are free text such as
-- "NGL students are taking AL1001, cannot read AB1088".
--
-- group_no / item_no preserve the source nesting verbatim. The scraper README
-- documents "outer = AND, inner = OR", but AB0602 is
-- [["AB0601"],["CC0001"],["SP0001"],["AL1601"],["AB1600"]] which under that
-- rule means 5 mandatory prerequisites — almost certainly wrong. Structure is
-- stored as-is so the interpretation can be fixed later without a rescrape.
CREATE TABLE prerequisites (
  code TEXT NOT NULL,
  sem  TEXT NOT NULL,
  group_no INTEGER NOT NULL,
  item_no  INTEGER NOT NULL,
  requires_code TEXT,
  raw_text TEXT NOT NULL,
  PRIMARY KEY (code, sem, group_no, item_no)
);

-- Load ledger: observability, no-op detection, and the row-count safety guard
-- that must gate any future automated load.
CREATE TABLE loads (
  sem   TEXT NOT NULL,
  scope TEXT NOT NULL,  -- 'courses' | 'exams'
  loaded_at   TEXT NOT NULL,
  source_hash TEXT,
  row_counts  TEXT,     -- JSON, per table
  PRIMARY KEY (sem, scope)
);

CREATE INDEX idx_offerings_sem     ON offerings(sem);
CREATE INDEX idx_offerings_code    ON offerings(code);
CREATE INDEX idx_slots_sem         ON class_slots(sem);
CREATE INDEX idx_slots_code_sem    ON class_slots(code, sem);
CREATE INDEX idx_indexes_code_sem  ON class_indexes(code, sem);
CREATE INDEX idx_exams_sem         ON exams(sem);
CREATE INDEX idx_prereq_code_sem   ON prerequisites(code, sem);
CREATE INDEX idx_prereq_requires   ON prerequisites(requires_code);
CREATE INDEX idx_offprog_programme ON offering_programmes(programme_id);
CREATE INDEX idx_offprog_code_sem  ON offering_programmes(code, sem);
CREATE INDEX idx_semesters_sortkey ON semesters(sort_key);
