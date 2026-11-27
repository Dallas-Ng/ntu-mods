type Cell = string | number | null | undefined

export function escapeMarkdown(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/[\\`*_{}[\]|]/g, "\\$&")
}

export function markdownTable(
  headers: string[],
  rows: Cell[][],
  { formattedColumns = [] }: { formattedColumns?: number[] } = {}
) {
  const line = (cells: Cell[], formatted: number[] = []) =>
    `| ${cells
      .map((cell, column) => {
        const text = String(cell ?? "")
          .replace(/\s+/g, " ")
          .trim()
        return formatted.includes(column) ? text : escapeMarkdown(text)
      })
      .join(" | ")} |`
  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map((row) => line(row, formattedColumns))
  ].join("\n")
}
