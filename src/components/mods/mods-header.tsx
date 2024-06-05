import { formatTitle } from "@/lib/format"

import Breadcrumbs from "../breadcrumbs"

interface Props {
  module: Module
}

const ModsHeader = ({ module }: Props) => {
  return (
    <div className="space-y-2">
      <Breadcrumbs
        breadcrumbs={[
          {
            name: "Mods",
            label: "Mods",
            href: `/mods`
          },
          {
            name: module.code,
            label: module.code,
            href: `/mods/${module.code}`
          }
        ]}
      />
      <h1 className="text-3xl">{formatTitle(module.title)}</h1>

      <div
        className="w-full text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: module.description
            .replaceAll("\n\n", "<br/><br/>")
            .replaceAll("\n", "<br/>")
        }}
      />
    </div>
  )
}

export default ModsHeader
