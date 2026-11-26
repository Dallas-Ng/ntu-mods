import { isValidElement, type ReactNode } from "react"

import { getDataUpdates } from "@/lib/server/data-updates"
import { TextLink } from "@/components/ui/text-link"

/**
 * The text of a changelog entry without its markup: links and emphasis become
 * their words, so the list reads as plain text.
 */
const plainText = (node: ReactNode): string => {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(plainText).join("")
  if (isValidElement<{ children?: ReactNode }>(node))
    return plainText(node.props.children)
  return ""
}

/**
 * The latest data refreshes from the changelog, for /developers/freshness.
 * Rendered on the server only. It reads the changelog itself because the
 * entries hold JSX, which cannot be passed in as a prop from an .astro page.
 */
const DataUpdates = ({ limit = 5 }: { limit?: number }) => (
  <>
    <ul>
      {getDataUpdates()
        .slice(0, limit)
        .map((update) => (
          <li key={update.slug}>
            <strong>
              <time dateTime={update.date}>{update.label}</time>
            </strong>
            , {update.title}.{" "}
            {update.items.map((item) => plainText(item.content)).join(" ")}
          </li>
        ))}
    </ul>
    <p>
      <TextLink href="/changelog?filter=data" variant="action" arrow>
        See every data update
      </TextLink>
    </p>
  </>
)

export default DataUpdates
