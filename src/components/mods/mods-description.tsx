// Matches list item markers at the start of a line:
//   (i), (ii), (1), (2), (a), (b)  — parenthesised
//   1 Title, 2 Title                 — bare number followed by uppercase word (SC4050 style)
//   - Title                          — dash-prefixed (SC3270 style)
const LIST_MARKER_RE =
  /^(?:\([ivxlcdm]+\)|\(\d+\)|\([a-z]\)|\d+\.?|-)\s+(?=[A-Z("])/i

type Group = { list: true; items: string[] } | { list: false; items: string[] }

function group(description: string): Group[] {
  const groups: Group[] = []
  for (const chunk of description.split("\n").filter(Boolean)) {
    const isList = LIST_MARKER_RE.test(chunk)
    const last = groups.at(-1)
    if (last && last.list === isList) {
      last.items.push(chunk)
    } else {
      groups.push({ list: isList, items: [chunk] })
    }
  }
  return groups
}

export default function ModsDescription({
  description
}: {
  description: string
}) {
  return (
    <div className="space-y-3 text-sm">
      {group(description).map((g, i) =>
        g.list ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {g.items.map((item, j) => (
              <li key={j} className="leading-relaxed text-pretty">
                {item.replace(LIST_MARKER_RE, "")}
              </li>
            ))}
          </ul>
        ) : (
          g.items.map((para, j) => (
            <p key={`${i}-${j}`} className="leading-relaxed text-pretty">
              {para}
            </p>
          ))
        )
      )}
    </div>
  )
}
