// How long the site has been live and how much has changed, for the home page.
// Commit counts come from the history of `main`; regenerate with:
//   git log origin/main --format='%ad' --date=format:'%Y-%m' | sort | uniq -c
//   git log origin/main --format=%s | grep -c "(#[0-9]*)$"   (merged pull requests)
// Last generated 2026-10-17. Months with no commits are kept at 0 on purpose.
export const SITE_ACTIVITY = {
  since: "Oct 2023",
  mergedPullRequests: 183,
  commitsByMonth: {
    "2023-10": 12,
    "2023-11": 9,
    "2023-12": 99,
    "2024-01": 124,
    "2024-02": 0,
    "2024-03": 5,
    "2024-04": 13,
    "2024-05": 0,
    "2024-06": 4,
    "2024-07": 0,
    "2024-08": 0,
    "2024-09": 0,
    "2024-10": 0,
    "2024-11": 0,
    "2024-12": 0,
    "2025-01": 0,
    "2025-02": 0,
    "2025-03": 0,
    "2025-04": 0,
    "2025-05": 0,
    "2025-06": 0,
    "2025-07": 0,
    "2025-08": 0,
    "2025-09": 0,
    "2025-10": 0,
    "2025-11": 0,
    "2025-12": 0,
    "2026-01": 0,
    "2026-02": 13,
    "2026-03": 24,
    "2026-04": 23,
    "2026-05": 81,
    "2026-06": 35,
    "2026-07": 17,
    "2026-08": 15,
    "2026-09": 8,
    "2026-10": 23
  } as Record<string, number>
}
