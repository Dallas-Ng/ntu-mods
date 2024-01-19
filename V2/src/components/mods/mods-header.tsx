import { formatTitle } from "@/lib/format"

import ModsReadMore from "./mods-read-more"

interface Props {
  module: Module
}

const ModsHeader = ({ module }: Props) => {
  return (
    <>
      <span className="text-muted-foreground">{module.code}</span>

      <h1 className="text-3xl capitalize">{formatTitle(module.title)}</h1>

      <ModsReadMore>
        <div
          className="w-full"
          dangerouslySetInnerHTML={{
            __html: module.description
              .replaceAll("\n\n", "<br/><br/>")
              .replaceAll("\n", "<br/>")
          }}
        />
      </ModsReadMore>
    </>
  )
}

export default ModsHeader
