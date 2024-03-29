import { formatTitle } from "@/lib/format"

interface Props {
  module: Module
}

const ModsHeader = ({ module }: Props) => {
  return (
    <>
      <span className="text-muted-foreground">{module.code}</span>

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
