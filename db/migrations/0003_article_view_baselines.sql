-- Unique readers each article had before article_views existed (from analytics
-- history, bots excluded). The displayed count is this plus COUNT(*) of
-- article_views, so a past reader who returns is counted once more.
CREATE TABLE article_view_baselines (
  slug TEXT PRIMARY KEY,
  n    INTEGER NOT NULL
);
