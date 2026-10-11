import type { DbModule } from "@/lib/server/db/types"

/** Head title/description for a module's "current offering" page — shared by the static build and the on-demand fallback so they read identically. */
export function buildModuleMeta(code: string, moduleData: DbModule) {
  const trimmed = moduleData.description?.trim()
  const description = trimmed
    ? `${trimmed.slice(0, 100)}${trimmed.length > 100 ? "…" : ""}`
    : `${code} ${moduleData.title} is a ${moduleData.au} AU NTU module. See index schedules, class times, exams, venues and prerequisites.`

  return {
    title: `${code} ${moduleData.title} (${moduleData.au} AU) | NTUMods`,
    description
  }
}

const FACULTY_ARTICLE: Record<string, { href: string; label: string }> = {
  EEE: { href: "/articles/ntu-eee-modules", label: "NTU EEE Modules Guide" },
  ME: { href: "/articles/ntu-mae-modules", label: "NTU MAE Modules Guide" },
  CEE: { href: "/articles/ntu-cee-modules", label: "NTU CEE Modules Guide" },
  BUS: {
    href: "/articles/ntu-business-modules",
    label: "NTU Business Modules Guide"
  },
  SOH: {
    href: "/articles/ntu-humanities-arts-social-sciences-modules",
    label: "NTU Humanities Modules Guide"
  }
}

/** Contextual "Planning Guides" links shown on a module page — shared by the static build and the on-demand fallback so they read identically. */
export function buildRelatedArticles(moduleData: DbModule) {
  return [
    ...(moduleData.faculty && FACULTY_ARTICLE[moduleData.faculty]
      ? [FACULTY_ARTICLE[moduleData.faculty]]
      : []),
    ...((moduleData.categories ?? []).includes("GLOAD")
      ? [
          {
            href: "/articles/complete-ntu-bde-list",
            label: "Complete NTU BDE List"
          },
          {
            href: "/articles/how-to-bid-for-bde-at-ntu",
            label: "How to Bid for a BDE at NTU"
          }
        ]
      : []),
    { href: "/articles/ntu-stars-guide", label: "NTU STARS Guide" },
    {
      href: "/articles/ntu-degree-audit-guide",
      label: "NTU Degree Audit Guide"
    },
    {
      href: "/articles/how-to-plan-for-modules",
      label: "How to Plan NTU Modules Before STARS Opens"
    }
  ]
}
