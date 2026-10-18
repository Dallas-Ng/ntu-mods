import { ChevronRight } from "lucide-react"

interface Props {
  related: Array<{ code: string; title: string }>
  emptyHref?: string
  emptyLabel?: string
}

// Presentational only — the two callers (the prerendered /mods/[module] page
// and the on-demand fallback in 404.astro) source `related` differently
// (build-time JSON vs a D1 query), since the JSON reader this used to call
// directly (repo.ts's getAllModuleMetadata) needs node:fs and can't run in
// the on-demand path.
const RelatedModules = ({ related, emptyHref, emptyLabel }: Props) =>
  related.length > 0 ? (
    <ul className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
      {related.map((module) => (
        <li key={module.code} className="border-b">
          <a
            href={`/mods/${module.code}`}
            className="hover:bg-accent group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors">
            <span className="text-muted-foreground w-16 shrink-0 font-mono text-xs">
              {module.code}
            </span>
            <span className="min-w-0 flex-1 truncate">{module.title}</span>
            <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </li>
      ))}
    </ul>
  ) : emptyHref && emptyLabel ? (
    <a
      href={emptyHref}
      className="text-muted-foreground hover:text-primary-alt text-sm transition-colors">
      {emptyLabel}
    </a>
  ) : null

export default RelatedModules
