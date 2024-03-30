import { formatTitle } from "@/lib/format"
import { getModuleFaculty } from "@/lib/get-module-faculty"

import Breadcrumbs from "../breadcrumbs"

interface Props {
  module: Module
}

const ModsHeader = ({ module }: Props) => {
  const faculty = getModuleFaculty(module.searchKeys)

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          {
            name: faculty,
            label: faculty,
            href: `/mods?moduleFaculty=${faculty}`
          },
          { name: module.code, label: module.code, href: `/${module.code}` }
        ]}
      />

      <h1 className="text-3xl capitalize">{formatTitle(module.title)}</h1>

      <div
        className="w-full text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: module.description
            .replaceAll("\n\n", "<br/><br/>")
            .replaceAll("\n", "<br/>")
        }}
      />
    </>
  )
}

export default ModsHeader
