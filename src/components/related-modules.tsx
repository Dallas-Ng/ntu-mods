import ModuleCard from "./module-card"

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
    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
      {related.map((module) => (
        <ModuleCard key={module.code} module={module} />
      ))}
    </div>
  ) : emptyHref && emptyLabel ? (
    <a
      href={emptyHref}
      className="text-muted-foreground hover:text-primary-alt text-sm transition-colors">
      {emptyLabel}
    </a>
  ) : null

export default RelatedModules
