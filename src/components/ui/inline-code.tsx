import * as React from "react"

/** Inline code. Styled in globals.css with dev-docs and article code, so all three match. */
function InlineCode(props: React.ComponentProps<"code">) {
  return <code data-slot="inline-code" {...props} />
}

export { InlineCode }
