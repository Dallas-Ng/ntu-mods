import { formatTitle } from "@/lib/format"
import type { ApiModule } from "@/lib/server/get-module-metadata"

import Breadcrumbs from "../breadcrumbs"

interface Props {
  module: ApiModule
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
    <div className="space-y-2">
      <Breadcrumbs
        breadcrumbs={[
          { name: "Mods", label: "Mods", href: "/mods" },
          {
            name: module.code,
            label: module.code,
            href: `/mods/${module.code}`
          }
        ]}
      />
      <h1 className="text-3xl font-semibold">{formatTitle(module.title)}</h1>
      <p className="text-muted-foreground text-sm">
        {isCurrentOffering ? "Current offering" : "Last offered"} — AY
        {currentYear}/{parseInt(currentYear) + 1} {semName}
      </p>
    </div>
  )
}

export default ModsHeader
