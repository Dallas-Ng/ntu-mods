import { formatTitle } from "@/lib/format"

import ReadMore from "../read-more"

interface Props {
  module: CourseData
}

export default function ModsHeader({ module }: Props) {
  return (
    <>
      <span className="text-secondary">{module.code}</span>

      <h1 className="text-3xl capitalize">{formatTitle(module.title)}</h1>

      <ReadMore>
        <div
          className="w-full"
          dangerouslySetInnerHTML={{
            __html: module.description
              .replaceAll("\n\n", "<br/><br/>")
              .replaceAll("\n", "<br/>")
          }}
        />
      </ReadMore>
    </>
  )
}
