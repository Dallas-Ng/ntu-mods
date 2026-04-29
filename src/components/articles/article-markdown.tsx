import Link from "next/link"

import type { ArticleHeading } from "@/lib/server/articles"
import { cn } from "@/lib/utils"

interface Props {
  content: string
  headings: ArticleHeading[]
}

const headingIds = (headings: ArticleHeading[]) => {
  const queue = new Map<number, string[]>()
  headings.forEach((heading) => {
    const ids = queue.get(heading.depth) ?? []
    ids.push(heading.id)
    queue.set(heading.depth, ids)
  })
  return queue
}

const parseInline = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = []
  const regex =
    /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))

    const token = match[0]
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={match.index}
          className="break-words rounded bg-muted px-1 py-0.5 text-sm text-foreground">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={match.index}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("~~")) {
      nodes.push(<s key={match.index}>{token.slice(2, -2)}</s>)
    } else if (token.startsWith("*")) {
      nodes.push(<em key={match.index}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith("!")) {
      const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token)
      if (image) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={match.index}
            src={image[2]}
            alt={image[1]}
            className="my-6 w-full rounded-md border bg-card object-cover"
          />
        )
      }
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (link) {
        const isExternal = /^https?:\/\//.test(link[2])
        nodes.push(
          <Link
            key={match.index}
            href={link[2]}
            className="break-words font-medium text-primary underline-offset-4 hover:underline"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}>
            {link[1]}
          </Link>
        )
      }
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

const isTableDivider = (line: string) =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)

const isTableStart = (lines: string[], index: number) =>
  lines[index]?.includes("|") && isTableDivider(lines[index + 1] || "")

const splitTableRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())

const getTableAlignments = (line: string) =>
  splitTableRow(line).map((cell) => {
    const startsWithColon = cell.startsWith(":")
    const endsWithColon = cell.endsWith(":")

    if (startsWithColon && endsWithColon) return "center"
    if (endsWithColon) return "right"
    return "left"
  })

const renderTable = (
  headers: string[],
  alignments: string[],
  rows: string[][],
  key: string
) => (
  <div key={key} className="my-5 max-w-full overflow-x-auto sm:my-6">
    <table className="min-w-[36rem] text-left text-sm">
      <thead>
        <tr>
          {headers.map((header, headerIndex) => (
            <th
              key={headerIndex}
              className={cn(
                "whitespace-nowrap bg-muted px-3 py-2 font-semibold text-foreground",
                alignments[headerIndex] === "center" && "text-center",
                alignments[headerIndex] === "right" && "text-right"
              )}>
              {parseInline(header)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {headers.map((_, cellIndex) => (
              <td
                key={cellIndex}
                className={cn(
                  "px-3 py-2 leading-6 text-foreground/90",
                  alignments[cellIndex] === "center" && "text-center",
                  alignments[cellIndex] === "right" && "text-right"
                )}>
                {parseInline(row[cellIndex] || "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const renderList = (lines: string[], ordered: boolean, key: string) => {
  const Tag = ordered ? "ol" : "ul"
  return (
    <Tag
      key={key}
      className={cn(
        "my-4 space-y-1 pl-6 leading-7 text-foreground/90",
        ordered ? "list-decimal" : "list-disc"
      )}>
      {lines.map((line, index) => {
        const content = line.replace(/^([-*]|\d+\.)\s+/, "")
        const task = /^\[( |x|X)\]\s+(.+)$/.exec(content)

        if (task) {
          return (
            <li key={index} className="list-none">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={task[1].toLowerCase() === "x"}
                  readOnly
                  className="mt-1.5"
                />
                <span>{parseInline(task[2])}</span>
              </label>
            </li>
          )
        }

        return <li key={index}>{parseInline(content)}</li>
      })}
    </Tag>
  )
}

const ArticleMarkdown = ({ content, headings }: Props) => {
  const ids = headingIds(headings)
  const lines = content.split("\n")
  const blocks: React.ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    if (line.startsWith("```")) {
      const language = line.replace("```", "").trim()
      const code: string[] = []
      index += 1

      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index])
        index += 1
      }

      blocks.push(
        <pre
          key={index}
          className="my-5 max-w-full overflow-x-auto rounded-md border bg-muted p-3 text-sm text-foreground sm:my-6 sm:p-4">
          <code data-language={language} className="whitespace-pre">
            {code.join("\n")}
          </code>
        </pre>
      )
      index += 1
      continue
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      const depth = heading[1].length
      const id = ids.get(depth)?.shift()
      const text = parseInline(heading[2])

      if (depth === 1) {
        blocks.push(
          <h1
            key={index}
            className="mb-5 break-words text-3xl font-bold leading-tight tracking-normal text-foreground sm:mb-6 md:text-5xl">
            {text}
          </h1>
        )
      } else if (depth === 2) {
        blocks.push(
          <h2
            key={index}
            id={id}
            className="scroll-mt-24 break-words pt-10 text-2xl font-semibold leading-tight tracking-normal text-foreground sm:pt-12 sm:text-3xl">
            {text}
          </h2>
        )
      } else if (depth === 3) {
        blocks.push(
          <h3
            key={index}
            id={id}
            className="scroll-mt-24 break-words pt-8 text-xl font-semibold leading-snug tracking-normal text-foreground sm:text-2xl">
            {text}
          </h3>
        )
      } else {
        blocks.push(
          <h4
            key={index}
            className="scroll-mt-24 break-words pt-6 text-lg font-semibold leading-snug tracking-normal text-foreground sm:text-xl">
            {text}
          </h4>
        )
      }

      index += 1
      continue
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index])
      const alignments = getTableAlignments(lines[index + 1])
      const rows: string[][] = []
      index += 2

      while (index < lines.length && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]))
        index += 1
      }

      blocks.push(renderTable(headers, alignments, rows, `table-${index}`))
      continue
    }

    if (/^([-*])\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^([-*])\s+/.test(lines[index])) {
        items.push(lines[index])
        index += 1
      }
      blocks.push(renderList(items, false, `ul-${index}`))
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index])
        index += 1
      }
      blocks.push(renderList(items, true, `ol-${index}`))
      continue
    }

    if (line.startsWith(">")) {
      const quote: string[] = []
      while (index < lines.length && lines[index].startsWith(">")) {
        quote.push(lines[index].replace(/^>\s?/, ""))
        index += 1
      }
      blocks.push(
        <blockquote
          key={index}
          className="my-5 break-words rounded-md border border-l-4 border-primary/20 border-l-primary bg-primary/5 px-4 py-3 text-foreground shadow-sm sm:my-6">
          {parseInline(quote.join(" "))}
        </blockquote>
      )
      continue
    }

    if (line.trim() === "---") {
      blocks.push(<hr key={index} className="my-8" />)
      index += 1
      continue
    }

    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !isTableStart(lines, index) &&
      !/^([-*]|\d+\.)\s+/.test(lines[index]) &&
      !lines[index].startsWith(">") &&
      !lines[index].startsWith("```")
    ) {
      paragraph.push(lines[index])
      index += 1
    }

    blocks.push(
      <p key={index} className="my-4 break-words leading-7 text-foreground/90">
        {parseInline(paragraph.join(" "))}
      </p>
    )
  }

  return <div className="min-w-0 max-w-full">{blocks}</div>
}

export default ArticleMarkdown
