import type { DbModule } from "@/lib/server/db/types"

import Breadcrumbs from "../breadcrumbs"
import Header from "../header"

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
      <Header
        title={`${module.code} ${module.title}`}
        subtitle={`${isCurrentOffering ? "Current offering" : "Last offered"}: AY${currentYear}/${parseInt(currentYear) + 1} ${semName}`}
      />
    </div>
  )
}

export default ModsHeader
