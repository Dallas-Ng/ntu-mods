-- One row per (article, browser). COUNT(*) per slug = unique views.
CREATE TABLE article_views (
  slug       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (slug, visitor_id)
);
