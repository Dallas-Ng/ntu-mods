import type { DbModule } from "@/lib/server/db/types"

import Breadcrumbs from "../breadcrumbs"

interface Props {
  module: DbModule
  currentYear: string
  currentSemester: string
  isCurrentOffering?: boolean
}

const ModsHeader = ({
  module,
  currentYear,
  currentSemester,
  isCurrentOffering = true
}: Props) => {
  const semName =
    currentSemester === "S" ? "Special Term" : `Semester ${currentSemester}`

  return (
    <div className="space-y-3">
      <Breadcrumbs
        breadcrumbs={[
          { label: "Mods", href: "/mods" },
          {
            label: module.code,
            href: `/mods/${module.code}`
          }
        ]}
      />
      <h1 className="text-3xl font-bold tracking-tighter text-balance sm:text-4xl">
        {module.code} {module.title}
      </h1>
      <p className="text-muted-foreground text-sm">
        {isCurrentOffering ? "Current offering" : "Last offered"}: AY
        {currentYear}/{parseInt(currentYear) + 1} {semName}
      </p>
    </div>
  )
}

export default ModsHeader
